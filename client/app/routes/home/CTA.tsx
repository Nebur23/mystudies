import { ArrowRight, BookOpen, UsersRoundIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';

export const CTASection = () => {
    const features = [
          {
              icon: BookOpen,
              title: "For Students",
              body: "Access quality learning resources, join live classes, take quizzes and connect with peers.",
              btnAction:"Explore courses",
              href:"/courses"
          },
          {
              icon: UsersRoundIcon,
              title: "For Teachers",
              body: "Share your knowledge, create courses, access teaching resources and earn revenue from your content",
              btnAction:"Create an account",
              href:"/sign-up"
          },
      ]
  return (
    <section className="my-8 flex flex-col items-center justify-center px-4 py-16 sm:px-6 md:my-12 md:py-20">
      <div className="space-y-4 text-center">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">For every learner</h3>
        <h2 className="text-3xl font-semibold tracking-tight text-primary md:text-4xl">
          Learning that moves you forward
        </h2>
        <p className="mx-auto max-w-xl text-sm leading-6 text-foreground/70">
          Whether you’re preparing for exams or sharing what you know, start with the tools and community you need.
        </p>
      </div>
      <div className="mt-8 grid w-full max-w-5xl gap-5 md:grid-cols-2">
        {features.map(feature => (
          <article
            key={feature.title}
            className="group flex min-h-60 flex-col items-start rounded-2xl border border-primary/10 bg-white/80 p-6 shadow-[0_14px_40px_-32px_rgba(11,61,50,0.55)] transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_48px_-32px_rgba(11,61,50,0.55)] sm:p-8"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">
              <feature.icon size={21} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-primary">{feature.title}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-foreground/70">{feature.body}</p>
            <Button asChild variant="link" className="mt-auto h-auto px-0 pt-5 text-sm font-semibold">
              <Link to={feature.href}>
                {feature.btnAction}
                <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CTASection;