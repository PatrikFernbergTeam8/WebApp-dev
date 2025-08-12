import {
  Typography,
} from "@material-tailwind/react";
import { BanknotesIcon, UsersIcon, UserPlusIcon, ChartBarIcon, PrinterIcon, CurrencyDollarIcon, BookmarkIcon, WrenchScrewdriverIcon, HandRaisedIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import React from "react";

export function Leveransstatus() {
  // Format value for display
  const formatValue = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    } else {
      return `${value}`;
    }
  };

  return (
    <div className="mb-8">
      {/* Combined Statistics - Full Width Background */}
      <div className="relative mb-12 py-20 w-full bg-[url('/img/background-image.png')] bg-cover bg-center">
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between gap-8">
            {/* Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 flex-1">
              {/* Skrivare i lager */}
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="rounded-xl p-4 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <PrinterIcon className="w-12 h-12 mb-4 opacity-90" />
                    <Typography variant="h6" className="opacity-90 mb-2 whitespace-nowrap">
                      Skrivare i lager
                    </Typography>
                    <Typography variant="h3" className="font-bold">
                      0
                    </Typography>
                  </div>
                </div>
              </div>
              
              {/* Lagervärde */}
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="rounded-xl p-4 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <CurrencyDollarIcon className="w-12 h-12 mb-4 opacity-90" />
                    <Typography variant="h6" className="opacity-90 mb-2">
                      Lagervärde
                    </Typography>
                    <Typography variant="h3" className="font-bold">
                      0
                    </Typography>
                  </div>
                </div>
              </div>
              
              {/* Reserverade */}
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="rounded-xl p-4 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <HandRaisedIcon className="w-12 h-12 mb-4 opacity-90" />
                    <Typography variant="h6" className="opacity-90 mb-2">
                      Reserverade
                    </Typography>
                    <Typography variant="h3" className="font-bold">
                      0
                    </Typography>
                  </div>
                </div>
              </div>
              
              {/* Sålda */}
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="rounded-xl p-4 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <CheckCircleIcon className="w-12 h-12 mb-4 opacity-90" />
                    <Typography variant="h6" className="opacity-90 mb-2">
                      Sålda
                    </Typography>
                    <Typography variant="h3" className="font-bold">
                      0
                    </Typography>
                  </div>
                </div>
              </div>
              
              {/* Lagning */}
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="rounded-xl p-4 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <WrenchScrewdriverIcon className="w-12 h-12 mb-4 opacity-90" />
                    <Typography variant="h6" className="opacity-90 mb-2">
                      Under lagning
                    </Typography>
                    <Typography variant="h3" className="font-bold">
                      0
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-blue-900/40 to-purple-900/50"></div>
      </div>

      {/* Content area for future development */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Typography variant="h5" color="blue-gray" className="mb-2">
            Leveransstatus
          </Typography>
          <Typography variant="paragraph" color="gray" className="text-sm">
            Denna sida är under utveckling. Funktionalitet kommer att läggas till här.
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default Leveransstatus;