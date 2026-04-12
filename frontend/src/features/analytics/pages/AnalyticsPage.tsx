import { useMemo, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { Box, Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { ParentSize } from '@visx/responsive'
import { Group } from '@visx/group'
import { GridRows, GridColumns } from '@visx/grid'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { scaleBand, scaleLinear, scalePoint, scaleOrdinal } from '@visx/scale'
import { Bar, LinePath, Pie } from '@visx/shape'

import { apiRequest } from '@/lib/api'

type Point = { date: string; count: number }
type AnalyticsResponse = {
  range: { from: string; to: string; days: number }
  totals: { jobs: number; photos: number; reports: number; sessions: number; messages: number; quizzes: number; customers: number }
  series: { jobsCreated: Point[]; photosUploaded: Point[]; reportsGenerated: Point[]; sessionsCreated: Point[] }
  jobsByStatus: { status: string; count: number }[]
  messagesByRole: { role: string; count: number }[]
  topCustomers: { customerName: string; count: number }[]
  sessionMessageLeaders: { sessionId: string; title: string; count: number }[]
}

type DatePreset = '7' | '30' | '90' | '365' | 'custom'

const COLORS = ['#2563eb', '#9333ea', '#ea580c', '#16a34a', '#dc2626', '#0891b2']

function ChartShell({ title, subtitle, children }: Readonly<{ title: string; subtitle?: string; children: React.ReactNode }>) {
  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <CardContent>
        <Typography variant='h6' fontWeight={700}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1.25 }}>
            {subtitle}
          </Typography>
        ) : null}
        <Box sx={{ width: '100%', height: 280 }}>{children}</Box>
      </CardContent>
    </Card>
  )
}

function TimeSeriesLine({ data, color }: Readonly<{ data: Point[]; color: string }>) {
  if (data.length === 0) return <Typography color='text.secondary'>No data in selected date range.</Typography>

  return (
    <ParentSize>
      {({ width, height }) => {
        const margin = { top: 12, right: 16, bottom: 36, left: 42 }
        const innerWidth = Math.max(0, width - margin.left - margin.right)
        const innerHeight = Math.max(0, height - margin.top - margin.bottom)
        const dates = data.map(point => point.date)
        const maxValue = Math.max(...data.map(point => point.count), 1)

        const xScale = scalePoint<string>({ domain: dates, range: [0, innerWidth] })
        const yScale = scaleLinear<number>({ domain: [0, maxValue], range: [innerHeight, 0], nice: true })

        return (
          <svg width={width} height={height}>
            <Group left={margin.left} top={margin.top}>
              <GridRows scale={yScale} width={innerWidth} stroke='#e5e7eb' />
              <GridColumns scale={xScale} height={innerHeight} stroke='#f3f4f6' />
              <LinePath<Point>
                data={data}
                x={d => xScale(d.date) ?? 0}
                y={d => yScale(d.count)}
                stroke={color}
                strokeWidth={2.5}
              />
              {data.map(point => (
                <circle key={point.date} cx={xScale(point.date)} cy={yScale(point.count)} r={3} fill={color} />
              ))}
              <AxisLeft scale={yScale} numTicks={5} />
              <AxisBottom
                top={innerHeight}
                scale={xScale}
                tickFormat={value => dayjs(String(value)).format(data.length > 14 ? 'MM/DD' : 'MMM D')}
                numTicks={Math.min(6, dates.length)}
              />
            </Group>
          </svg>
        )
      }}
    </ParentSize>
  )
}

function HorizontalBars({
  data,
  labelKey,
  valueKey,
  barColor,
}: Readonly<{ data: any[]; labelKey: string; valueKey: string; barColor: string }>) {
  if (data.length === 0) return <Typography color='text.secondary'>No data in selected date range.</Typography>

  return (
    <ParentSize>
      {({ width, height }) => {
        const margin = { top: 10, right: 12, bottom: 32, left: 130 }
        const innerWidth = Math.max(0, width - margin.left - margin.right)
        const innerHeight = Math.max(0, height - margin.top - margin.bottom)
        const labels = data.map(item => String(item[labelKey]).slice(0, 24))
        const max = Math.max(...data.map(item => Number(item[valueKey])), 1)

        const yScale = scaleBand<string>({ domain: labels, range: [0, innerHeight], padding: 0.2 })
        const xScale = scaleLinear<number>({ domain: [0, max], range: [0, innerWidth], nice: true })

        return (
          <svg width={width} height={height}>
            <Group left={margin.left} top={margin.top}>
              <GridColumns scale={xScale} height={innerHeight} stroke='#f3f4f6' />
              {data.map(item => {
                const label = String(item[labelKey]).slice(0, 24)
                const value = Number(item[valueKey])
                const y = yScale(label) ?? 0
                const barHeight = yScale.bandwidth()
                return <Bar key={label} x={0} y={y} width={xScale(value)} height={barHeight} fill={barColor} rx={4} />
              })}
              <AxisLeft scale={yScale} hideAxisLine hideTicks tickLabelProps={() => ({ fontSize: 11, textAnchor: 'end', dx: '-0.4em', dy: '0.25em' })} />
              <AxisBottom top={innerHeight} scale={xScale} numTicks={5} />
            </Group>
          </svg>
        )
      }}
    </ParentSize>
  )
}

function PieChart({ data, labelKey, valueKey }: Readonly<{ data: any[]; labelKey: string; valueKey: string }>) {
  if (data.length === 0) return <Typography color='text.secondary'>No data in selected date range.</Typography>

  const colorScale = scaleOrdinal<string, string>({ domain: data.map(item => item[labelKey]), range: COLORS })

  return (
    <ParentSize>
      {({ width, height }) => {
        const radius = Math.min(width, height) / 2 - 12
        const centerX = width / 2
        const centerY = height / 2
        return (
          <svg width={width} height={height}>
            <Group top={centerY} left={centerX}>
              <Pie data={data} pieValue={item => item[valueKey]} outerRadius={radius} innerRadius={radius * 0.55} padAngle={0.01}>
                {pie =>
                  pie.arcs.map(arc => {
                    const label = String(arc.data[labelKey])
                    const [labelX, labelY] = pie.path.centroid(arc)
                    return (
                      <g key={label}>
                        <path d={pie.path(arc) ?? ''} fill={colorScale(label)} />
                        <text x={labelX} y={labelY} fill='white' fontSize={10} textAnchor='middle' dy='0.33em'>
                          {arc.data[valueKey]}
                        </text>
                      </g>
                    )
                  })
                }
              </Pie>
            </Group>
          </svg>
        )
      }}
    </ParentSize>
  )
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<DatePreset>('30')
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().subtract(29, 'day').startOf('day'))
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().endOf('day'))

  const range = useMemo(() => {
    if (preset === 'custom') return { from: startDate, to: endDate }
    const days = Number(preset)
    return { from: dayjs().subtract(days - 1, 'day').startOf('day'), to: dayjs().endOf('day') }
  }, [preset, startDate, endDate])

  const query = useQuery({
    queryKey: ['analytics-overview', range.from.format('YYYY-MM-DD'), range.to.format('YYYY-MM-DD')],
    queryFn: () =>
      apiRequest<AnalyticsResponse>(`/analytics/overview?from=${range.from.format('YYYY-MM-DD')}&to=${range.to.format('YYYY-MM-DD')}`),
  })

  const data = query.data

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={2} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' gap={1.5}>
          <Box>
            <Typography variant='h4' fontWeight={800}>
              Analytics
            </Typography>
            <Typography color='text.secondary'>Core operational metrics for jobs, photo evidence, reports, and customer activity.</Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            <FormControl size='small' sx={{ minWidth: 190 }}>
              <InputLabel id='analytics-range-label'>Date Window</InputLabel>
              <Select
                labelId='analytics-range-label'
                value={preset}
                label='Date Window'
                onChange={event => setPreset(event.target.value as DatePreset)}
              >
                <MenuItem value='7'>Last 7 days</MenuItem>
                <MenuItem value='30'>Last 30 days</MenuItem>
                <MenuItem value='90'>Last 90 days</MenuItem>
                <MenuItem value='365'>Last 12 months</MenuItem>
                <MenuItem value='custom'>Custom</MenuItem>
              </Select>
            </FormControl>

            {preset === 'custom' ? (
              <>
                <DatePicker label='From' value={startDate} onChange={next => next && setStartDate(next.startOf('day'))} slotProps={{ textField: { size: 'small' } }} />
                <DatePicker label='To' value={endDate} onChange={next => next && setEndDate(next.endOf('day'))} slotProps={{ textField: { size: 'small' } }} />
              </>
            ) : null}
          </Stack>
        </Stack>

        <Grid container spacing={1.5}>
          {[
            ['Jobs', data?.totals.jobs ?? 0],
            ['Photos', data?.totals.photos ?? 0],
            ['Reports', data?.totals.reports ?? 0],
            ['Customers', data?.totals.customers ?? 0],
          ].map(([label, value]) => (
            <Grid key={label} size={{ xs: 6, md: 3 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    {label}
                  </Typography>
                  <Typography variant='h5' fontWeight={700}>
                    {value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 8 }}>
            <ChartShell title='Jobs Created Trend' subtitle='New jobs created over time'>
              <TimeSeriesLine data={data?.series.jobsCreated ?? []} color='#2563eb' />
            </ChartShell>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <ChartShell title='Job Status Mix' subtitle='Distribution of pipeline stages'>
              <PieChart data={data?.jobsByStatus ?? []} labelKey='status' valueKey='count' />
            </ChartShell>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <ChartShell title='Top Customers' subtitle='Most active customers by job count'>
              <HorizontalBars data={data?.topCustomers ?? []} labelKey='customerName' valueKey='count' barColor='#9333ea' />
            </ChartShell>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartShell title='Reports Generated Trend' subtitle='How many reports were generated over time'>
              <TimeSeriesLine data={data?.series.reportsGenerated ?? []} color='#ea580c' />
            </ChartShell>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <ChartShell title='Photos Uploaded Trend' subtitle='Photo evidence growth across selected dates'>
              <TimeSeriesLine data={data?.series.photosUploaded ?? []} color='#16a34a' />
            </ChartShell>
          </Grid>
        </Grid>
      </Stack>
    </LocalizationProvider>
  )
}
