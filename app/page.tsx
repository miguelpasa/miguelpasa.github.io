import Image from "next/image";
import { IntroBanner } from "./components/IntroBanner/IntroBanner";
import { MainSplits } from "./components/MainSplits/MainSplits";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between">
            <IntroBanner />
            <MainSplits />
        </main>
    )
}
