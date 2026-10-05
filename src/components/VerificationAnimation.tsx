'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface VerificationAnimationProps {
  onComplete: () => void;
}

export function VerificationAnimation({ onComplete }: VerificationAnimationProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    t('checking_step_1'),
    t('checking_step_2'),
    t('checking_step_3'),
    t('checking_step_4'),
    t('checking_step_5')
  ];

  useEffect(() => {
    const stepDuration = 280; // 5 steps * 280ms = 1.4s total animation time
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(onComplete, 200);
          return prev;
        }
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [onComplete, steps.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm mc-card-gold p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FAF6EC] border border-[#D99B26]/40 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#D99B26] animate-spin" />
        </div>

        <h3 className="text-xl font-sans font-bold text-[#1D2821] mb-1">
          {t('checking_step_3')}
        </h3>
        <p className="text-xs text-[#636058] mb-6">
          Querying verified official LOTIS gazette records
        </p>

        {/* Step-by-step progress checklist */}
        <div className="space-y-2 text-left bg-[#F5F2EB] rounded-xl p-3.5 border border-[#DDD9CE]">
          {steps.map((stepText, idx) => {
            const isFinished = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div key={idx} className="flex items-center space-x-2.5 text-xs">
                {isFinished ? (
                  <CheckCircle2 className="w-4 h-4 text-[#8B5E0D] shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-[#C9A227] animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#DDD9CE] shrink-0" />
                )}
                <span
                  className={
                    isCurrent
                      ? 'text-[#8B5E0D] font-bold'
                      : isFinished
                      ? 'text-[#8B5E0D] font-semibold'
                      : 'text-[#A09C94]'
                  }
                >
                  {stepText}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
