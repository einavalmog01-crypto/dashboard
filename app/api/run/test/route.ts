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
}

export async function POST(request: Request) {
  try {
    const body: TestRunRequest = await request.json()
    const { testId, testName, environment, config } = body

    console.log(`[TestRunner] Running test: ${testName} (${testId}) on ${environment}`)
    console.log(`[TestRunner] Endpoint: ${config.endpoint.host}`)
    console.log(`[TestRunner] DB: ${config.db.hostname}:${config.db.port}`)

    // Route to the appropriate test handler
    switch (testId) {
      case "cable-retail-submit-order":
        return await runCableSubmitOrder(config, environment, "Retail")
      case "cable-telesales-submit-order":
        return await runCableSubmitOrder(config, environment, "Telesales")
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
  channel: "Retail" | "Telesales"
) {
  const { auth, db, endpoint } = config

  // Generate random OrderID
  const orderId = Math.floor(100000000 + Math.random() * 900000000).toString()
  console.log(`[Cable${channel}SubmitOrder] Generated OrderID: ${orderId}`)

  const steps: { name: string; status: "PASS" | "FAILED"; message: string }[] = []

  try {
    // STEP 1: SubmitOrder (GenerateContract)
    console.log(`[Cable${channel}SubmitOrder] Step 1: SubmitOrder (GenerateContract)`)
    
    const submitOrderXml = buildSubmitOrderXml(orderId, "GenerateContract")
    
    const generateContractResponse = await fetch(
      `${endpoint.host}/VFDESubmitOrderEG/VFDE`,
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
      throw new Error(`GenerateContract SOAP Fault: ${faultMatch?.[1] || "Unknown"}`)
    }

    // Extract OGWOrderID
    const ogwOrderIdMatch = generateContractText.match(/<OGWOrderID>(.*?)<\/OGWOrderID>/)
    if (!ogwOrderIdMatch) {
      throw new Error("OGWOrderID not found in GenerateContract response")
    }
    const ogwOrderId = ogwOrderIdMatch[1]
    console.log(`[Cable${channel}SubmitOrder] Extracted OGWOrderID: ${ogwOrderId}`)

    steps.push({ name: "SubmitOrder (GenerateContract)", status: "PASS", message: `OGWOrderID: ${ogwOrderId}` })

    // STEP 2: SubmitOrder (Fulfillment)
    console.log(`[Cable${channel}SubmitOrder] Step 2: SubmitOrder (Fulfillment)`)
    
    const fulfillmentXml = buildSubmitOrderXml(orderId, "Fulfillment", ogwOrderId)
    
    const fulfillmentResponse = await fetch(
      `${endpoint.host}/VFDESubmitOrderEG/VFDE`,
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
      throw new Error(`Fulfillment SOAP Fault: ${faultMatch?.[1] || "Unknown"}`)
    }

    steps.push({ name: "SubmitOrder (Fulfillment)", status: "PASS", message: "Fulfillment submitted" })

    // STEP 3: SetOrderStatus
    console.log(`[Cable${channel}SubmitOrder] Step 3: SetOrderStatus`)
    
    const setOrderStatusXml = buildSetOrderStatusXml(ogwOrderId)
    
    const setOrderStatusResponse = await fetch(
      `${endpoint.host}/VFDESetOrderStatusEG/VFDE`,
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
      throw new Error(`SetOrderStatus SOAP Fault: ${faultMatch?.[1] || "Unknown"}`)
    }

    steps.push({ name: "SetOrderStatus", status: "PASS", message: "Order status set successfully" })

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
