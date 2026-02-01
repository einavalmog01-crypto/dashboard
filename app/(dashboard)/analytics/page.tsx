"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Zap,
} from "lucide-react";
import { useState } from "react";

const passRateData = [
  { date: "Jan 1", passed: 85, failed: 15 },
  { date: "Jan 2", passed: 88, failed: 12 },
  { date: "Jan 3", passed: 82, failed: 18 },
  { date: "Jan 4", passed: 90, failed: 10 },
  { date: "Jan 5", passed: 87, failed: 13 },
  { date: "Jan 6", passed: 92, failed: 8 },
  { date: "Jan 7", passed: 94, failed: 6 },
];

const executionTimeData = [
  { suite: "Auth", time: 45 },
  { suite: "E-comm", time: 120 },
  { suite: "Perf", time: 180 },
  { suite: "Infra", time: 60 },
  { suite: "API", time: 90 },
];

const testDistribution = [
  { name: "Passed", value: 142, color: "var(--color-success)" },
  { name: "Failed", value: 18, color: "var(--color-destructive)" },
  { name: "Skipped", value: 8, color: "var(--color-warning)" },
];

const recentRuns = [
  {
    id: "RUN-001",
    suite: "Authentication Suite",
    status: "passed",
    duration: "2m 34s",
    tests: { passed: 24, failed: 0, skipped: 1 },
    timestamp: "10 minutes ago",
  },
  {
    id: "RUN-002",
    suite: "E-commerce Flow",
    status: "failed",
    duration: "5m 12s",
    tests: { passed: 38, failed: 3, skipped: 0 },
    timestamp: "25 minutes ago",
  },
  {
    id: "RUN-003",
    suite: "API Integration",
    status: "passed",
    duration: "1m 45s",
    tests: { passed: 18, failed: 0, skipped: 0 },
    timestamp: "1 hour ago",
  },
  {
    id: "RUN-004",
    suite: "Performance Tests",
    status: "passed",
    duration: "8m 20s",
    tests: { passed: 12, failed: 0, skipped: 2 },
    timestamp: "2 hours ago",
  },
  {
    id: "RUN-005",
    suite: "Infrastructure",
    status: "failed",
    duration: "3m 55s",
    tests: { passed: 15, failed: 2, skipped: 0 },
    timestamp: "3 hours ago",
  },
];

const topFailures = [
  {
    test: "Checkout payment processing",
    suite: "E-commerce",
    failures: 12,
    trend: "up",
  },
  {
    test: "Database connection timeout",
    suite: "Infrastructure",
    failures: 8,
    trend: "down",
  },
  {
    test: "Session expiration handling",
    suite: "Authentication",
    failures: 6,
    trend: "up",
  },
  {
    test: "Image upload validation",
    suite: "API",
    failures: 4,
    trend: "stable",
  },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");

  const stats = {
    totalRuns: 156,
    passRate: 89.2,
    avgDuration: "3m 24s",
    testsExecuted: 2847,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Results & Analytics</h1>
          <p className="text-muted-foreground">
            Track test performance and identify issues
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Test Runs
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRuns}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+12%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pass Rate
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+2.4%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3 text-success" />
              <span className="text-success">-8%</span> faster than before
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tests Executed
            </CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testsExecuted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+18%</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pass Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={passRateData}>
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="passed"
                    stroke="var(--color-success)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-success)", strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="var(--color-destructive)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-destructive)", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution Time by Suite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={executionTimeData} layout="vertical">
                  <XAxis
                    type="number"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="suite"
                    type="category"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value}s`, "Duration"]}
                  />
                  <Bar
                    dataKey="time"
                    fill="var(--color-primary)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution + Top Failures */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Test Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={testDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {testDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center gap-6">
              {testDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Failing Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Suite</TableHead>
                  <TableHead>Failures</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topFailures.map((failure, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{failure.test}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{failure.suite}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 text-destructive">
                        <XCircle className="h-4 w-4" />
                        {failure.failures}
                      </span>
                    </TableCell>
                    <TableCell>
                      {failure.trend === "up" && (
                        <TrendingUp className="h-4 w-4 text-destructive" />
                      )}
                      {failure.trend === "down" && (
                        <TrendingDown className="h-4 w-4 text-success" />
                      )}
                      {failure.trend === "stable" && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Test Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run ID</TableHead>
                <TableHead>Suite</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Results</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-mono text-sm">{run.id}</TableCell>
                  <TableCell className="font-medium">{run.suite}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        run.status === "passed"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      }
                    >
                      {run.status === "passed" ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {run.duration}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-success">{run.tests.passed} passed</span>
                      {run.tests.failed > 0 && (
                        <span className="text-destructive">{run.tests.failed} failed</span>
                      )}
                      {run.tests.skipped > 0 && (
                        <span className="text-muted-foreground">{run.tests.skipped} skipped</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {run.timestamp}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
