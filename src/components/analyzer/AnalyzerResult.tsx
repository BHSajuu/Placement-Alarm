import Link from 'next/link'
import React from 'react'
import Summary from './Result/Summary'
import ATS from './Result/ATS'
import Details from './Result/Details'

function AnalyzerResult({result}:{result:any}) {
 
 
  return (
    <main className="!pt-0">
            <nav className="resume-nav">
                <Link href="/analyzer" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                {/* <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    className="w-full h-full object-contain rounded-2xl"
                                    title="resume"
                                />
                            </a>
                        </div>
                    )}
                </section> */}
                <section className="feedback-section">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                    {result ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={result} />
                            <ATS score={result.ATS.score || 0} suggestions={result.ATS.tips || []} />
                            <Details feedback={result} />
                        </div>
                    ) : (
                        <img src="/resume-scan-2.gif" className="w-full" />
                    )}
                </section>
            </div>
        </main>
  )
}

export default AnalyzerResult