import { ChatFeedbackIcon, Mortarboard01Icon, Quiz03Icon, QuizIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";



export  function Features() {

    return (
        <section className="relative bg-surface-container-lowest  px-6 md:px-24 flex flex-col items-center text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary-container rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 max-w-4xl">
               
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary-container/10 flex items-center justify-center rounded-lg text-primary-container">
                            <span className="material-symbols-outlined"> <HugeiconsIcon icon={Quiz03Icon} /> </span>
                        </div>
                        <div>
                            <h3 className="font-h3 text-body-md font-bold text-on-surface">10,000+ Past Questions</h3>
                            <p className="text-metadata text-on-surface-variant mt-1">Full O-Level &amp; A-Level archives from 2000 to present.</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant flex items-start gap-4">
                        <div className="w-12 h-12 bg-secondary-container/20 flex items-center justify-center rounded-lg text-primary-container">
                            <span className="material-symbols-outlined"><HugeiconsIcon icon={Mortarboard01Icon} /></span>
                        </div>
                        <div>
                            <h3 className="font-h3 text-body-md font-bold text-on-surface">Expert-Led Courses</h3>
                            <p className="text-metadata text-on-surface-variant mt-1">Video lessons by Cameroon's top-rated examiners.</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant flex items-start gap-4">
                        <div className="w-12 h-12 bg-tertiary-fixed flex items-center justify-center rounded-lg text-primary-container">
                            <span className="material-symbols-outlined"><HugeiconsIcon icon={ChatFeedbackIcon} /></span>
                        </div>
                        <div>
                            <h3 className="font-h3 text-body-md font-bold text-on-surface">Live Community</h3>
                            <p className="text-metadata text-on-surface-variant mt-1">Study groups and direct access to academic mentors.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}