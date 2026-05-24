import Head from 'next/head'
import dynamic from 'next/dynamic'

const Dashboard = dynamic(() => import('../components/Dashboard'), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0A0C11', flexDirection: 'column', gap: 16
    }}>
      <div style={{ fontSize: 36 }}>📊</div>
      <div style={{ fontFamily: 'sans-serif', color: '#4EFFA0', fontSize: 14 }}>Loading Dashboard...</div>
    </div>
  )
})

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>Progress Dashboard — AlgoPath</title>
        <meta name="description" content="Track your NeetCode 150 journey with streaks, badges, notes and bookmarks" />
      </Head>
      <Dashboard />
    </>
  )
}
