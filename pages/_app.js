import { SessionProvider } from 'next-auth/react'
import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </Head>
      <Component {...pageProps} />
    </SessionProvider>
  )
}
