import { BookOpen, UsersRoundIcon, Tv, FileBadge2, PenBox } from "lucide-react";



export function Features() {
    const features = [
        {
            icon: BookOpen,
            title: "Creator-led Courses",
            body: "Learn from experience teachers and industry experts."
        },
        {
            icon: UsersRoundIcon,
            title: "Social Learning",
            body: "Study together, Share Ideas and get support."
        },
        {
            icon: PenBox,
            title: "Quizzes & Practice",
            body: "Test your knowledge and track your progress."
        },
        {
            icon: Tv,
            title: "Live Classes",
            body: "Join interactive classes and ask questions in real time."
        },
        {
            icon: UsersRoundIcon,
            title: "Comunity",
            body: "Be part of a supportive learner's community"
        },
        {
            icon: FileBadge2,
            title: "Certificates",
            body: "Showcase your skills and earn certificates."
        }

    ]

    return (

        <section className="my-12 flex flex-col items-center justify-center px-4 py-16 md:py-20">

            <div className=" text-center space-y-4 ">

                <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">OUR FEATURES</h3>
                <h2 className="text-3xl md:text-4xl text-primary font-black">Everything you need to succeed</h2>
                <p className="text-sm text-text/75 text-center w-full max-w-lg mx-auto">From quality courses to a supportive community, YIGIL gives you the right tools
                    to learn, practice and achieve your academic goals.
                </p>

            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 pt-4 gap-4 w-full max-w-5xl mt-8">
                {features.map(feature => (
                    <div key={feature.title} className="group flex min-h-52 flex-col justify-center items-center space-y-3 rounded-xl border border-white/80 bg-white/65 px-6 py-7 text-center shadow-[0_10px_35px_-28px_rgba(11,61,50,0.45)] transition duration-200 hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_18px_40px_-28px_rgba(11,61,50,0.55)]">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f1e9] transition-colors group-hover:bg-[#d8ebdf]">

                            <feature.icon className="text-primary" size={21} />
                        </div>

                        <p className="font-bold text-primary">{feature.title}</p>
                        <p className="text-center text-sm leading-relaxed text-text/70">{feature.body}</p>

                    </div>
                ))}



            </div>

        </section>


    )
}