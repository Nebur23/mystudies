import { Statistics } from "./Statistics";
import pilot from "./pilot.png";

export const About = () => {
    return (
        <section
            id="about"
            className="container py-24 sm:py-32"
        >
            <div className=" py-12">
                <div className="px-6 flex flex-col-reverse md:flex-row gap-8 md:gap-12">
                    <img
                        src={pilot}
                        alt=""
                        className="md:w-1/2 object-contain rounded-lg"
                    />
                    <div className="bg-green-0 flex flex-col justify-between">
                        <div className="pb-6">
                            <h2 className="text-3xl md:text-4xl font-bold">
                                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                                    About{" "}
                                </span>
                                US
                            </h2>
                            <p className="md:text-xl text-muted-foreground mt-4">
                                We believe every student deserves access to clear, structured, and effective learning tools. <br /> <br />

                                Our platform brings together lessons, past papers, and interactive quizzes to help students move from confusion to confidence. By organizing content around topics and real exam formats, we make it easier to understand what to study, how to practice, and how to improve. <br />

                               

                                Our goal is not just to help you pass exams, but to help you truly understand what you learn and build confidence for the future.
                            </p>
                        </div>

                        <Statistics />
                    </div>
                </div>
            </div>
        </section>
    );
};