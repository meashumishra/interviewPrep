import Head from 'next/head'
import dynamic from 'next/dynamic'

const SolutionExplorer = dynamic(() => import('../components/SolutionExplorer'), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0A0C11', flexDirection: 'column', gap: 16
    }}>
      <div style={{ fontSize: 36 }}>🔍</div>
      <div style={{ fontFamily: 'sans-serif', color: '#4EFFA0', fontSize: 14 }}>Loading Solution Explorer...</div>
    </div>
  )
})

export default function SolutionsPage() {
  return (
    <>
      <Head>
        <title>Solution Explorer — AlgoPath</title>
        <meta name="description" content="Every approach explained — brute force to optimal. Powered by AI." />
      </Head>
      <SolutionExplorer />
    </>
  )
}
