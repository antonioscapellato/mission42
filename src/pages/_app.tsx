// Style
import "@/styles/globals.css";

//NextJS
import type { AppProps } from "next/app";

//HeorUI
import { HeroUIProvider } from "@heroui/react";
import {ThemeProvider as NextThemesProvider} from "next-themes";



export default function App({ Component, pageProps }: AppProps) {

  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        <Component {...pageProps} />
      </NextThemesProvider>
    </HeroUIProvider>
  )
}
