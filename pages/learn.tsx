import Head from 'next/head'
import dynamic from 'next/dynamic'

const Platform = dynamic(() => import('../components/Platform'), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0A0C11', flexDirection: 'column', gap: 16
    }}>
      <div style={{ fontSize: 36 }}>⚡</div>
      <div style={{ fontFamily: 'sans-serif', color: '#4EFFA0', fontSize: 14 }}>Loading AlgoPath...</div>
    </div>
  )
})

export default function LearnPage() {
  return (
    <>
      <Head>
        <title>Learn DSA — AlgoPath</title>
        <meta name="description" content="Interactive data structures and algorithms with animated visualizers" />
      </Head>
      <Platform />
    </>
  )
}
