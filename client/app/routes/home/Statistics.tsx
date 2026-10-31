export const Statistics = () => {
  interface statsProps {
    quantity: string;
    description: string;
  }

  const stats: statsProps[] = [
    {
      quantity: "2.7K+",
      description: "Students",
    },
    {
      quantity: "500+",
      description: "Active Teachers",
    },
    {
      quantity: "100+",
      description: "Courses",
    },
    {
      quantity: "Cameroon",
      description: "Our current focus",
    },
  ];

  return (
    <section id="statistics" className="mx-4 my-8 rounded-2xl border border-white/80 bg-white/65 px-5 py-10 shadow-[0_18px_50px_-40px_rgba(11,61,50,0.5)] md:mx-auto md:max-w-5xl md:px-10">
      <div className=" text-center space-y-4 ">

        <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">Our growing impact</h3>
      

      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-12">
        {stats.map(({ quantity, description }: statsProps) => (
          <div
            key={description}
            className="space-y-2 text-center border-r border-primary/10 last:border-r-0"
          >
            <h2 className="text-3xl sm:text-4xl font-semibold text-primary">{quantity}</h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};