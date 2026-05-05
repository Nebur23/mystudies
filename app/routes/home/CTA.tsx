import React from 'react';
import { ArrowRight, BookOpen, Users, Award } from 'lucide-react';
import { Button } from '~/components/ui/button';
import Logo from '~/components/logo';

interface CTASectionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonHref?: string;
  showStats?: boolean;
}

export const CTASection: React.FC<CTASectionProps> = ({
  title = "Ready to transform your studies?",
  description = "Join over 1 million learners and start your journey today. Get personalized guidance from top experts.",
  primaryButtonText = "Start learning for free",
  secondaryButtonText = "Talk to an mentor",
  primaryButtonHref = "/sign-up",
  secondaryButtonHref = "/contact",
  showStats = true,
}) => {
  return (
    <section className="bg-white border-t border-b border-slate-200 py-16 md:py-24 mt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              {title}
            </h2>
            <p className="text-lg text-slate-600 max-w-lg">
              {description}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                //href={primaryButtonHref}
                size={"lg"}
                className=""
              >
                {primaryButtonText}
                <ArrowRight size={20} className="ml-2" />
              </Button>
              <Button
                //={secondaryButtonHref}
                size={"lg"}
                variant={'outline'}
                className="text-base font-semibold text-slate-700 bg-white border-2 border-slate-300  hover:border-purple-600 hover:text-purple-600 transition-colors duration-200"
              >
                {secondaryButtonText}
              </Button>
            </div>

            {/* Trust Indicators */}
            {showStats && (
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Users size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">1M+</p>
                    <p className="text-sm text-slate-600">Learners</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <BookOpen size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">300+</p>
                    <p className="text-sm text-slate-600">Courses</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Award size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">92%</p>
                    <p className="text-sm text-slate-600">Success rate</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="aspect-square md:aspect-[4/3] bg-gradient-to-br from-purple-50 to-slate-50 rounded-2xl p-8 md:p-12 flex items-center justify-center">
              <div className="relative w-full max-w-sm">
                {/* Decorative elements */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-purple-100 rounded-full opacity-50 blur-xl"></div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-200 rounded-full opacity-30 blur-xl"></div>
                
                {/* Main card */}
                <div className="relative bg-white rounded-xl shadow-lg p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border rounded-full flex items-center justify-center">
                        <Logo />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">MasterYourStudies</p>
                      <p className="text-sm text-slate-600">Learning Path</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-purple-600 rounded-full"></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-semibold text-purple-600">75%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-8 h-8 bg-slate-200 rounded-full border-2 border-white"
                        ></div>
                      ))}
                    </div>
                    <span className="text-sm text-slate-600">+2.5k learners</span>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -bottom-6 -right-6 bg-white rounded-lg shadow-md p-4 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-slate-900">4.9/5</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">From 15k+ reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;