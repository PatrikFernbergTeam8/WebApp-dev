import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Avatar,
  Chip,
  Tooltip,
  Progress,
  Button,
  Spinner,
  Input,
} from "@material-tailwind/react";
import { EllipsisVerticalIcon, ArrowPathIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { BanknotesIcon, UsersIcon, UserPlusIcon, ChartBarIcon, PrinterIcon, CurrencyDollarIcon, BookmarkIcon, WrenchScrewdriverIcon, HandRaisedIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { printersInventoryData } from "@/data";
import React, { useState, useEffect } from "react";
import { StatisticsCard } from "@/widgets/cards";

// Import Google Sheets hook
import { useGoogleSheetsData, reservePrinterInSheet, unreservePrinterInSheet } from "@/services/googleSheets";

export function Leveransstatus() {
  // Use Google Sheets API - hooks must be called at top level
  const { data: liveData, loading, error, refetch } = useGoogleSheetsData();
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'status',
    direction: 'asc'
  });

  // Reservation input state
  const [reservationInput, setReservationInput] = useState({
    rowNumber: null,
    name: ''
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use live data if available, otherwise fall back to static data
  const allPrinters = liveData.length > 0 ? liveData : printersInventoryData;
  
  // Sorting function
  const sortPrinters = (printers) => {
    if (!sortConfig.key) return printers;
    
    return [...printers].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'brandModel':
          aValue = `${a.brand} ${a.model}`.toLowerCase();
          bValue = `${b.brand} ${b.model}`.toLowerCase();
          break;
        case 'serialNumber':
          aValue = (a.serialNumber || '').toLowerCase();
          bValue = (b.serialNumber || '').toLowerCase();
          break;
        case 'status':
          // Custom status order: Tillgänglig, Ej klar, Under lagning, Levererad
          const statusOrder = {
            'tillgänglig': 1,
            'inväntar rekond': 2,
            'under lagning': 3,
            'levererad': 4
          };
          aValue = statusOrder[getStatusText(a.status).toLowerCase()] || 5;
          bValue = statusOrder[getStatusText(b.status).toLowerCase()] || 5;
          break;
        case 'location':
          aValue = (a.location || '').toLowerCase();
          bValue = (b.location || '').toLowerCase();
          break;
        case 'sellerName':
          aValue = (a.sellerName || '').toLowerCase();
          bValue = (b.sellerName || '').toLowerCase();
          break;
        case 'rakneverkSV':
          aValue = (a.rakneverkSV || '').toLowerCase();
          bValue = (b.rakneverkSV || '').toLowerCase();
          break;
        case 'rakneverkFarg':
          aValue = (a.rakneverkFarg || '').toLowerCase();
          bValue = (b.rakneverkFarg || '').toLowerCase();
          break;
        case 'customerName':
          aValue = (a.customerName || '').toLowerCase();
          bValue = (b.customerName || '').toLowerCase();
          break;
        case 'price':
          // Extract numeric value for price sorting
          const extractPrice = (price) => {
            if (typeof price === 'string') {
              const numMatch = price.replace(/\s/g, '').match(/\d+/);
              return numMatch ? parseInt(numMatch[0]) : 0;
            }
            return typeof price === 'number' ? price : 0;
          };
          aValue = extractPrice(a.price);
          bValue = extractPrice(b.price);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };
  
  // Handle sort click
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Get status text function (moved up to be available for filtering)
  const getStatusText = (status) => {
    switch (status) {
      case "delivered":
        return "Levererad";
      case "pending":
        return "Inväntar rekond";
      case "cancelled":
        return "Under lagning";
      case "available":
        return "Tillgänglig";
      default:
        return status;
    }
  };
  
  // Search/filter function
  const filterPrinters = (printers) => {
    if (!searchQuery.trim()) return printers;
    
    return printers.filter(printer => {
      const searchTerm = searchQuery.toLowerCase();
      return (
        (printer.brand || '').toLowerCase().includes(searchTerm) ||
        (printer.model || '').toLowerCase().includes(searchTerm) ||
        (printer.serialNumber || '').toLowerCase().includes(searchTerm) ||
        (printer.location || '').toLowerCase().includes(searchTerm) ||
        (printer.sellerName || '').toLowerCase().includes(searchTerm) ||
        (printer.customerName || '').toLowerCase().includes(searchTerm) ||
        `${printer.brand} ${printer.model}`.toLowerCase().includes(searchTerm)
      );
    });
  };

  // Separate, filter, and sort printers based on condition and search query
  const usedPrinters = sortPrinters(filterPrinters(allPrinters.filter(printer => printer.condition === 'used')));
  const soldPrinters = sortPrinters(filterPrinters(allPrinters.filter(printer => printer.condition === 'sold')));
  
  
  // Function to show reservation input
  const showReservationInput = (printer) => {
    setReservationInput({
      rowNumber: printer._rowNumber,
      name: ''
    });
  };

  // Function to cancel reservation input
  const cancelReservationInput = () => {
    setReservationInput({
      rowNumber: null,
      name: ''
    });
  };

  // Function to confirm reservation
  const confirmReservation = async (printer) => {
    if (!reservationInput.name.trim()) {
      alert('Vänligen ange ditt namn');
      return;
    }

    try {
      const success = await reservePrinterInSheet(printer, reservationInput.name.trim());
      if (success) {
        // Reset input state
        setReservationInput({
          rowNumber: null,
          name: ''
        });
        // Refresh data from Google Sheets
        refetch();
      } else {
        console.error('Failed to reserve printer in Google Sheets');
      }
    } catch (error) {
      console.error('Error reserving printer:', error);
    }
  };
  
  // Function to unreserve a printer by updating Google Sheets
  const unreservePrinter = async (printer) => {
    try {
      const success = await unreservePrinterInSheet(printer);
      if (success) {
        // Refresh data from Google Sheets
        refetch();
      } else {
        console.error('Failed to unreserve printer in Google Sheets');
      }
    } catch (error) {
      console.error('Error unreserving printer:', error);
    }
  };

  // Function to parse reservation info and check if expired
  const parseReservationInfo = (reservedBy) => {
    if (!reservedBy) return null;
    
    const reservationMatch = reservedBy.match(/Reserverad av (.+?) till (\d{4}-\d{2}-\d{2})/);
    if (reservationMatch) {
      const [, name, dateString] = reservationMatch;
      const expiryDate = new Date(dateString);
      const today = new Date();
      const isExpired = expiryDate < today;
      
      return {
        name,
        expiryDate: dateString,
        isExpired,
        daysLeft: Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
      };
    }
    
    return null;
  };
  
  // Calculate statistics
  const totalPrinters = usedPrinters.length + soldPrinters.length;
  const totalReserved = allPrinters.filter(printer => printer.reservedBy && printer.condition !== 'sold').length;
  
  // Calculate total inventory value (all printers regardless of status or reservation)
  const totalValue = allPrinters.reduce((sum, printer) => {
    const value = printer.price;
    if (typeof value === 'string') {
      // Extract number from string like "5 000" or "Se avtal"
      const numMatch = value.replace(/\s/g, '').match(/\d+/);
      return sum + (numMatch ? parseInt(numMatch[0]) : 0);
    }
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
  
  // Debug log
  console.log('All printers for value calculation:', allPrinters.length);
  console.log('Used printers:', usedPrinters.length);
  console.log('Sold printers:', soldPrinters.length);
  console.log('Reserved printers:', totalReserved);
  console.log('Total value:', totalValue);
  
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
  
  // Debug log to see what data we're getting
  console.log('Live data:', liveData);
  console.log('Used printers:', usedPrinters.length);
  console.log('Sold printers:', soldPrinters.length);
  
  return (
    <div className="mb-8">
      {/* Combined Statistics and Search - Full Width Background */}
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
                      {totalPrinters}
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
                      {formatValue(totalValue)}
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
                      {totalReserved}
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
                      {soldPrinters.length}
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
                      {allPrinters.filter(p => p.status === 'cancelled').length}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="flex flex-col gap-3 w-1/3 min-w-[300px]">
              <Typography variant="h6" className="font-semibold text-white">
                Sök leveranser
              </Typography>
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Sök på kund, ordernummer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="!border-white/30 focus:!border-white focus:!border-t-white w-full rounded-lg !text-white placeholder:!text-white/70 bg-white/10"
                  labelProps={{
                    className: "hidden",
                  }}
                  containerProps={{
                    className: "!min-w-0",
                  }}
                />
                {searchQuery && (
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 rounded-lg border-white/30 text-white hover:bg-white/10 transition-all duration-200"
                  >
                    Rensa
                  </Button>
                )}
              </div>
              {searchQuery && (
                <div className="bg-black/20 rounded-lg p-3">
                  <Typography variant="small" className="text-sm font-medium text-white">
                    {(usedPrinters.length + soldPrinters.length) > 0 ? 
                      `${usedPrinters.length + soldPrinters.length} resultat funna` : 
                      'Inga resultat'
                    }
                  </Typography>
                </div>
              )}
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