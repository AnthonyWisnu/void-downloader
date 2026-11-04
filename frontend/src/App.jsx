import { useState } from "react";
import Navbar from "./components/Navbar";
import DownloaderPanel from "./components/DownloaderPanel";
import FAQSection from "./components/FAQSection";
import FeatureGrid from "./components/FeatureGrid";
import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import HowToSection from "./components/HowToSection";
import PlatformSupport from "./components/PlatformSupport";
import ResultSection from "./components/ResultSection";
import useDownloader from "./hooks/useDownloader";

function App() {
  const [activeTab, setActiveTab] = useState("url");
  const downloader = useDownloader();

  const activePlatform =
    activeTab === "converter"
      ? "converter"
      : downloader.detectedPlatform !== "unknown"
        ? downloader.detectedPlatform
        : downloader.result?.platform || "default";

  return (
    <div className="app" data-platform={activePlatform}>
      <Navbar healthStatus={downloader.healthStatus} />
      <HeroSection />

      <DownloaderPanel
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        url={downloader.url}
        error={downloader.error}
        isLoading={downloader.isLoading}
        detectedPlatform={downloader.detectedPlatform}
        canSubmit={downloader.canSubmit}
        onChange={downloader.setUrl}
        onSubmit={downloader.submit}
      />

      {activeTab === "url" && !downloader.isLoading && downloader.result ? (
        <ResultSection result={downloader.result} onReset={downloader.reset} />
      ) : null}

      <PlatformSupport />

      <FeatureGrid />

      <HowToSection />

      <FAQSection />

      <Footer healthStatus={downloader.healthStatus} />
    </div>
  );
}

export default App;
