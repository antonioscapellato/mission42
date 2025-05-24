// Style
import "@/styles/globals.css";

//NextJS
import type { AppProps } from "next/app";

//HeorUI
import { HeroUIProvider } from "@heroui/react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <HeroUIProvider>
      <Component {...pageProps} />
    </HeroUIProvider>
  )
}
