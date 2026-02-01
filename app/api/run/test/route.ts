import { NextResponse } from "next/server"

interface TestRunRequest {
  testId: string
  testName: string
  environment: string
  config: {
    auth: {
      username: string
      password: string
    }
    db: {
      hostname: string
      port: string
      connectionType: "sid" | "serviceName"
      sid: string
      serviceName: string
      username: string
      password: string
    }
    endpoint: {
      host: string
    }
    unix: {
      hostName: string
      port: string
      userName: string
      password: string
    }
  }
  customTemplates?: {
    [stepName: string]: string
  }
}

export async function POST(request: Request) {
  try {
    const body: TestRunRequest = await request.json()
    const { testId, testName, environment, config, customTemplates } = body

    console.log(`[TestRunner] Running test: ${testName} (${testId}) on ${environment}`)
    console.log(`[TestRunner] Endpoint: ${config.endpoint.host}`)
    console.log(`[TestRunner] DB: ${config.db.hostname}:${config.db.port}`)
    if (customTemplates) {
      console.log(`[TestRunner] Using custom templates for steps: ${Object.keys(customTemplates).join(", ")}`)
    }

    // Route to the appropriate test handler
    switch (testId) {
      case "cable-retail-submit-order":
        return await runCableSubmitOrder(config, environment, "Retail", customTemplates)
      case "cable-telesales-submit-order":
        return await runCableSubmitOrder(config, environment, "Telesales", customTemplates)
      default:
        // For other tests, simulate execution
        return await runGenericTest(testId, testName, config)
    }
  } catch (error) {
    console.error("[TestRunner] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

async function runCableSubmitOrder(
  config: TestRunRequest["config"],
  environment: string,
  channel: "Retail" | "Telesales",
  customTemplates?: { [stepName: string]: string }
) {
  const { auth, db, endpoint } = config

  // Generate random OrderID
  const orderId = Math.floor(100000000 + Math.random() * 900000000).toString()
  console.log(`[Cable${channel}SubmitOrder] Generated OrderID: ${orderId}`)

  const steps: { name: string; status: "PASS" | "FAILED"; message: string; request?: string; response?: string }[] = []

  try {
    // STEP 1: SubmitOrder (GenerateContract)
    console.log(`[Cable${channel}SubmitOrder] Step 1: SubmitOrder (GenerateContract)`)
    
    // Use custom template if provided, otherwise use default
    let submitOrderXml: string
    if (customTemplates?.["SubmitOrder (GenerateContract)"]) {
      submitOrderXml = customTemplates["SubmitOrder (GenerateContract)"]
        .replace(/\{\{ORDER_ID\}\}/g, orderId)
        .replace(/\{\{OGW_ORDER_ID\}\}/g, "")
    } else {
      submitOrderXml = buildSubmitOrderXml(orderId, "GenerateContract")
    }
    const generateContractUrl = `${endpoint.host}/VFDESubmitOrderEG/VFDE`
    
    const generateContractResponse = await fetch(
      generateContractUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml;charset=UTF-8",
          "SOAPAction": "SubmitOrder",
          "Authorization": "Basic " + btoa(`${auth.username}:${auth.password}`),
        },
        body: submitOrderXml,
      }
    )

    const generateContractText = await generateContractResponse.text()
    
    // Check for SOAP fault
    if (generateContractText.includes("<faultstring>")) {
      const faultMatch = generateContractText.match(/<faultstring>(.*?)<\/faultstring>/)
      steps.push({ 
        name: "SubmitOrder (GenerateContract)", 
        status: "FAILED", 
        message: `SOAP Fault: ${faultMatch?.[1] || "Unknown"}`,
        request: `POST ${generateContractUrl}\n\n${submitOrderXml}`,
        response: generateContractText
      })
      throw new Error(`GenerateContract SOAP Fault: ${faultMatch?.[1] || "Unknown"}`)
    }

    // Extract OGWOrderID
    const ogwOrderIdMatch = generateContractText.match(/<OGWOrderID>(.*?)<\/OGWOrderID>/)
    if (!ogwOrderIdMatch) {
      steps.push({ 
        name: "SubmitOrder (GenerateContract)", 
        status: "FAILED", 
        message: "OGWOrderID not found in response",
        request: `POST ${generateContractUrl}\n\n${submitOrderXml}`,
        response: generateContractText
      })
      throw new Error("OGWOrderID not found in GenerateContract response")
    }
    const ogwOrderId = ogwOrderIdMatch[1]
    console.log(`[Cable${channel}SubmitOrder] Extracted OGWOrderID: ${ogwOrderId}`)

    steps.push({ 
      name: "SubmitOrder (GenerateContract)", 
      status: "PASS", 
      message: `OGWOrderID: ${ogwOrderId}`,
      request: `POST ${generateContractUrl}\n\n${submitOrderXml}`,
      response: generateContractText
    })

    // STEP 2: SubmitOrder (Fulfillment)
    console.log(`[Cable${channel}SubmitOrder] Step 2: SubmitOrder (Fulfillment)`)
    
    // Use custom template if provided, otherwise use default
    let fulfillmentXml: string
    if (customTemplates?.["SubmitOrder (Fulfillment)"]) {
      fulfillmentXml = customTemplates["SubmitOrder (Fulfillment)"]
        .replace(/\{\{ORDER_ID\}\}/g, orderId)
        .replace(/\{\{OGW_ORDER_ID\}\}/g, ogwOrderId)
    } else {
      fulfillmentXml = buildSubmitOrderXml(orderId, "Fulfillment", ogwOrderId)
    }
    const fulfillmentUrl = `${endpoint.host}/VFDESubmitOrderEG/VFDE`
    
    const fulfillmentResponse = await fetch(
      fulfillmentUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml;charset=UTF-8",
          "SOAPAction": "SubmitOrder",
          "Authorization": "Basic " + btoa(`${auth.username}:${auth.password}`),
        },
        body: fulfillmentXml,
      }
    )

    const fulfillmentText = await fulfillmentResponse.text()
    
    if (fulfillmentText.includes("<faultstring>")) {
      const faultMatch = fulfillmentText.match(/<faultstring>(.*?)<\/faultstring>/)
      steps.push({ 
        name: "SubmitOrder (Fulfillment)", 
        status: "FAILED", 
        message: `SOAP Fault: ${faultMatch?.[1] || "Unknown"}`,
        request: `POST ${fulfillmentUrl}\n\n${fulfillmentXml}`,
        response: fulfillmentText
      })
      throw new Error(`Fulfillment SOAP Fault: ${faultMatch?.[1] || "Unknown"}`)
    }

    steps.push({ 
      name: "SubmitOrder (Fulfillment)", 
      status: "PASS", 
      message: "Fulfillment submitted",
      request: `POST ${fulfillmentUrl}\n\n${fulfillmentXml}`,
      response: fulfillmentText
    })

    // STEP 3: Wait for DB status = C after Fulfillment
    console.log(`[Cable${channel}SubmitOrder] Step 3: Waiting for DB status C (after Fulfillment)`)
    
    const dbCheckAfterFulfillment = await waitForSOSCompletion(
      db,
      ogwOrderId,
      "After Fulfillment",
      50,  // maxRetries
      5000 // sleepInterval (5 seconds)
    )

    if (!dbCheckAfterFulfillment.success) {
      steps.push({
        name: "DB Check (after Fulfillment)",
        status: "FAILED",
        message: dbCheckAfterFulfillment.message,
        request: `Query: SELECT MESSAGE_STATUS FROM set_order_status_req_handler WHERE CDM_TXID = '${ogwOrderId}'`,
        response: `Failed after ${dbCheckAfterFulfillment.attempts} attempts`
      })
      throw new Error(dbCheckAfterFulfillment.message)
    }

    steps.push({
      name: "DB Check (after Fulfillment)",
      status: "PASS",
      message: `${dbCheckAfterFulfillment.message} (${dbCheckAfterFulfillment.attempts} attempts)`,
      request: `Query: SELECT MESSAGE_STATUS FROM set_order_status_req_handler WHERE CDM_TXID = '${ogwOrderId}'`,
      response: `Order Line IDs: ${dbCheckAfterFulfillment.orderLineIds?.join(", ") || "N/A"}`
    })

    // STEP 4: SetOrderStatus
    console.log(`[Cable${channel}SubmitOrder] Step 3: SetOrderStatus`)
    
    // Use custom template if provided, otherwise use default
    let setOrderStatusXml: string
    if (customTemplates?.["SetOrderStatus"]) {
      setOrderStatusXml = customTemplates["SetOrderStatus"]
        .replace(/\{\{ORDER_ID\}\}/g, orderId)
        .replace(/\{\{OGW_ORDER_ID\}\}/g, ogwOrderId)
    } else {
      setOrderStatusXml = buildSetOrderStatusXml(ogwOrderId)
    }
    const setOrderStatusUrl = `${endpoint.host}/VFDESetOrderStatusEG/VFDE`
    
    const setOrderStatusResponse = await fetch(
      setOrderStatusUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml;charset=UTF-8",
          "SOAPAction": "SetOrderStatus",
          "Authorization": "Basic " + btoa(`${auth.username}:${auth.password}`),
        },
        body: setOrderStatusXml,
      }
    )

    const setOrderStatusText = await setOrderStatusResponse.text()
    
    if (setOrderStatusText.includes("<faultstring>")) {
      const faultMatch = setOrderStatusText.match(/<faultstring>(.*?)<\/faultstring>/)
      steps.push({ 
        name: "SetOrderStatus", 
        status: "FAILED", 
        message: `SOAP Fault: ${faultMatch?.[1] || "Unknown"}`,
        request: `POST ${setOrderStatusUrl}\n\n${setOrderStatusXml}`,
        response: setOrderStatusText
      })
      throw new Error(`SetOrderStatus SOAP Fault: ${faultMatch?.[1] || "Unknown"}`)
    }

    steps.push({ 
      name: "SetOrderStatus", 
      status: "PASS", 
      message: "Order status set successfully",
      request: `POST ${setOrderStatusUrl}\n\n${setOrderStatusXml}`,
      response: setOrderStatusText
    })

    // STEP 6: Wait for DB status = C after SetOrderStatus
    console.log(`[Cable${channel}SubmitOrder] Step 6: Waiting for DB status C (after SetOrderStatus)`)
    
    const dbCheckAfterSetStatus = await waitForSOSCompletion(
      db,
      ogwOrderId,
      "After SetOrderStatus",
      50,  // maxRetries
      5000 // sleepInterval (5 seconds)
    )

    if (!dbCheckAfterSetStatus.success) {
      steps.push({
        name: "DB Check (after SetOrderStatus)",
        status: "FAILED",
        message: dbCheckAfterSetStatus.message,
        request: `Query: SELECT MESSAGE_STATUS FROM set_order_status_req_handler WHERE CDM_TXID = '${ogwOrderId}'`,
        response: `Failed after ${dbCheckAfterSetStatus.attempts} attempts`
      })
      throw new Error(dbCheckAfterSetStatus.message)
    }

    steps.push({
      name: "DB Check (after SetOrderStatus)",
      status: "PASS",
      message: `${dbCheckAfterSetStatus.message} (${dbCheckAfterSetStatus.attempts} attempts)`,
      request: `Query: SELECT MESSAGE_STATUS FROM set_order_status_req_handler WHERE CDM_TXID = '${ogwOrderId}'`,
      response: `Order Line IDs: ${dbCheckAfterSetStatus.orderLineIds?.join(", ") || "N/A"}`
    })

    console.log(`[Cable${channel}SubmitOrder] All steps completed successfully for OGWOrderID: ${ogwOrderId}`)

    return NextResponse.json({
      success: true,
      orderId,
      ogwOrderId,
      channel,
      steps,
      message: `Cable ${channel} Submit Order completed successfully. OGWOrderID: ${ogwOrderId}`,
    })

  } catch (error) {
    console.error(`[Cable${channel}SubmitOrder] Error:`, error)
    return NextResponse.json({
      success: false,
      orderId,
      steps,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

/**
 * Wait for all order lines to have MESSAGE_STATUS = 'C' in the database
 * Polls the set_order_status_req_handler table up to maxRetries times
 */
async function waitForSOSCompletion(
  db: TestRunRequest["config"]["db"],
  ogwOrderId: string,
  stepName: string,
  maxRetries: number = 50,
  sleepInterval: number = 5000
): Promise<{ success: boolean; message: string; attempts: number; orderLineIds?: string[] }> {
  console.log(`[DB Check] ${stepName}: Checking order status for OGWOrderID: ${ogwOrderId}`)
  
  // Build Oracle connection string
  const connectionString = db.connectionType === "sid" 
    ? `${db.hostname}:${db.port}/${db.sid}`
    : `${db.hostname}:${db.port}/${db.serviceName}`

  const query = `
    SELECT 
      M.MESSAGE_STATUS,
      EXTRACTVALUE(XMLTYPE(M.MESSAGE_DATA), '//*[local-name()="OGWOrderLineId"]') AS ORDER_LINE_ID
    FROM set_order_status_req_handler M
    WHERE TRIM(M.CDM_TXID) = TRIM('${ogwOrderId}')
    ORDER BY TO_NUMBER(M.SUBSCRIBE_MESSAGE_ID)
  `

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[DB Check] Attempt ${attempt}/${maxRetries}`)
    
    try {
      // Call the database check API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/db/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          db: {
            hostname: db.hostname,
            port: db.port,
            connectionType: db.connectionType,
            sid: db.sid,
            serviceName: db.serviceName,
            username: db.username,
            password: db.password,
          },
          query,
        }),
      })

      if (!response.ok) {
        console.log(`[DB Check] Query failed, retrying...`)
        await new Promise(r => setTimeout(r, sleepInterval))
        continue
      }

      const result = await response.json()
      const rows = result.rows || []

      if (rows.length === 0) {
        console.log(`[DB Check] No rows found yet, waiting...`)
        await new Promise(r => setTimeout(r, sleepInterval))
        continue
      }

      // Check if all rows have MESSAGE_STATUS = 'C'
      let allCompleted = true
      const orderLineIds: string[] = []
      
      for (const row of rows) {
        const status = row.MESSAGE_STATUS || row[0]
        const lineId = row.ORDER_LINE_ID || row[1]
        
        if (lineId && /^\d+$/.test(lineId)) {
          orderLineIds.push(lineId)
        }
        
        if (status === "F") {
          return {
            success: false,
            message: `SetOrderStatus failed for OrderLineID ${lineId}`,
            attempts: attempt,
          }
        }
        
        if (status !== "C") {
          allCompleted = false
        }
      }

      if (allCompleted && orderLineIds.length > 0) {
        console.log(`[DB Check] All order lines completed with status C`)
        return {
          success: true,
          message: `All ${orderLineIds.length} order lines completed successfully`,
          attempts: attempt,
          orderLineIds,
        }
      }

      console.log(`[DB Check] Not all order lines completed yet (${rows.filter((r: any) => (r.MESSAGE_STATUS || r[0]) === 'C').length}/${rows.length} completed)`)
      await new Promise(r => setTimeout(r, sleepInterval))
      
    } catch (error) {
      console.log(`[DB Check] Error querying database:`, error)
      await new Promise(r => setTimeout(r, sleepInterval))
    }
  }

  return {
    success: false,
    message: `Timeout: Not all order lines reached status C after ${maxRetries} attempts`,
    attempts: maxRetries,
  }
}

function buildSubmitOrderXml(orderId: string, mode: "GenerateContract" | "Fulfillment", ogwOrderId?: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:SubmitOrder>
      <OrderID>${orderId}</OrderID>
      <Mode>${mode}</Mode>
      ${ogwOrderId ? `<OGWOrderID>${ogwOrderId}</OGWOrderID>` : "<OGWOrderID></OGWOrderID>"}
    </vfde:SubmitOrder>
  </soapenv:Body>
</soapenv:Envelope>`
}

function buildSetOrderStatusXml(ogwOrderId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vfde="http://vfde.amdocs.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <vfde:SetOrderStatus>
      <OGWSubOrderId>${ogwOrderId}</OGWSubOrderId>
    </vfde:SetOrderStatus>
  </soapenv:Body>
</soapenv:Envelope>`
}

async function runGenericTest(
  testId: string,
  testName: string,
  config: TestRunRequest["config"]
) {
  // Simulate test execution with a delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // For demo purposes, randomly pass/fail
  const success = Math.random() > 0.2
  
  return NextResponse.json({
    success,
    testId,
    testName,
    message: success ? "Test passed" : "Test failed (simulated)",
    error: success ? undefined : "Simulated failure for demo",
  })
}
