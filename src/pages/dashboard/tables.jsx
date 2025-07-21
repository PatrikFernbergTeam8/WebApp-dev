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
import { BanknotesIcon, UsersIcon, UserPlusIcon, ChartBarIcon, PrinterIcon, CurrencyDollarIcon } from "@heroicons/react/24/solid";
import { printersInventoryData } from "@/data";
import React, { useState, useEffect } from "react";
import { StatisticsCard } from "@/widgets/cards";

// Import Google Sheets hook
import { useGoogleSheetsData, reservePrinterInSheet, unreservePrinterInSheet } from "@/services/googleSheets";

export function Tables() {
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
            'ej klar': 2,
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
        return "Ej klar";
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
  const newPrinters = sortPrinters(filterPrinters(allPrinters.filter(printer => printer.condition === 'new')));
  
  
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
  
  // Calculate statistics
  const totalPrinters = usedPrinters.length + newPrinters.length;
  const totalReserved = allPrinters.filter(printer => printer.reservedBy).length;
  
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
  console.log('New printers:', newPrinters.length);
  console.log('Reserved printers:', totalReserved);
  console.log('Total value:', totalValue);

  // Function to render a printer table
  const renderPrinterTable = (printers, title, headerColor = "gray", isNewPrintersTable = false) => {
    return (
      <Card>
        <CardHeader variant="gradient" color={headerColor} className="mb-8 p-6">
          <div className="flex items-center justify-between">
            <Typography variant="h6" color="white">
              {title} ({printers.length}) {loading && <Spinner className="ml-2 h-4 w-4" />}
            </Typography>
            <div className="flex items-center gap-2">
              {error && (
                <Typography variant="small" color="red" className="mr-2">
                  Error: {error}
                </Typography>
              )}
              <Button
                variant="text"
                color="white"
                size="sm"
                onClick={refetch}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Uppdatera
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {[
                  { label: "Märke/Modell", key: "brandModel" },
                  { label: "Serienummer", key: "serialNumber" },
                  { label: "Status", key: "status" },
                  { label: isNewPrintersTable ? "Säljare" : "Senaste kund", key: isNewPrintersTable ? "sellerName" : "location" },
                  { label: "Lagervärde", key: "price" },
                  { label: "", key: null }
                ].map(({ label, key }) => (
                  <th
                    key={label}
                    className={`border-b border-blue-gray-50 py-3 px-5 text-left ${key ? 'cursor-pointer hover:bg-blue-gray-50' : ''}`}
                    onClick={key ? () => handleSort(key) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      <Typography
                        variant="small"
                        className="text-[11px] font-bold uppercase text-blue-gray-400"
                      >
                        {label}
                      </Typography>
                      {key && (
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            className={`h-3 w-3 ${
                              sortConfig.key === key && sortConfig.direction === 'asc' 
                                ? 'text-blue-500' 
                                : 'text-blue-gray-300'
                            }`}
                          />
                          <ChevronDownIcon 
                            className={`h-3 w-3 ${
                              sortConfig.key === key && sortConfig.direction === 'desc' 
                                ? 'text-blue-500' 
                                : 'text-blue-gray-300'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {printers.map(
                ({ brand, model, status, location, price, serialNumber, sellerName, customerName, isSold, _rowNumber }, key) => {
                  const className = `py-3 px-5 ${
                    key === printers.length - 1
                      ? ""
                      : "border-b border-blue-gray-50"
                  }`;

                  const getStatusColor = (status) => {
                    switch (status) {
                      case "delivered":
                        return "green";
                      case "pending":
                        return "orange";
                      case "cancelled":
                        return "red";
                      case "available":
                        return "green";
                      default:
                        return "blue-gray";
                    }
                  };

                  return (
                    <tr key={`${brand}-${model}-${key}`}>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {brand} {model}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {serialNumber}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Chip
                          variant="gradient"
                          color={getStatusColor(status)}
                          value={getStatusText(status)}
                          className="py-0.5 px-2 text-[11px] font-medium w-fit"
                        />
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {isNewPrintersTable && sellerName ? sellerName : location}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {price}
                        </Typography>
                      </td>
                      <td className={className}>
                        {/* Check if printer is reserved or sold */}
                        {allPrinters.find(p => p._rowNumber === _rowNumber)?.reservedBy ? (
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {allPrinters.find(p => p._rowNumber === _rowNumber)?.isSold ? 
                              `Såld till ${allPrinters.find(p => p._rowNumber === _rowNumber)?.customerName || 'okänd kund'}` : 
                              allPrinters.find(p => p._rowNumber === _rowNumber)?.reservedBy
                            }
                          </Typography>
                        ) : (
                          /* Show reservation input or button only for available printers */
                          status === 'available' ? (
                            reservationInput.rowNumber === _rowNumber ? (
                              <div className="flex gap-0.5 items-center">
                                <Input
                                  size="sm"
                                  placeholder="Ditt namn"
                                  value={reservationInput.name}
                                  onChange={(e) => setReservationInput(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-32 !border-blue-gray-200 focus:!border-blue-gray-200 focus:!border-t-blue-gray-200"
                                  labelProps={{
                                    className: "hidden",
                                  }}
                                  containerProps={{
                                    className: "!min-w-0",
                                  }}
                                />
                                <Button
                                  variant="gradient"
                                  color="green"
                                  size="sm"
                                  onClick={() => confirmReservation({ brand, model, status, location, price, serialNumber, _rowNumber })}
                                  className="px-2 py-1"
                                >
                                  OK
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="gray"
                                  size="sm"
                                  onClick={cancelReservationInput}
                                  className="px-2 py-1"
                                >
                                  Avbryt
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="gradient"
                                color="blue"
                                size="sm"
                                onClick={() => showReservationInput({ brand, model, status, location, price, serialNumber, _rowNumber })}
                                className="px-3 py-1"
                              >
                                Reservera
                              </Button>
                            )
                          ) : (
                            <Typography className="text-xs font-semibold text-blue-gray-600">
                              Går ej att reservera
                            </Typography>
                          )
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    );
  };
  
  // Format value for display
  const formatValue = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M kr`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k kr`;
    } else {
      return `${value} kr`;
    }
  };
  
  // Debug log to see what data we're getting
  console.log('Live data:', liveData);
  console.log('Used printers:', usedPrinters.length);
  console.log('New printers:', newPrinters.length);
  
  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      {/* Combined Statistics and Search Card */}
      <div className="mb-6">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between gap-6">
              {/* Statistics */}
              <div className="flex items-center gap-32">
                {/* Skrivare i lager */}
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg p-3">
                    <PrinterIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <Typography variant="small" className="text-blue-gray-600">
                      Skrivare i lager
                    </Typography>
                    <Typography variant="h5" color="blue-gray" className="font-bold">
                      {totalPrinters.toString()}
                    </Typography>
                  </div>
                </div>
                
                {/* Lagervärde */}
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg p-3">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <Typography variant="small" className="text-blue-gray-600">
                      Lagervärde
                    </Typography>
                    <Typography variant="h5" color="blue-gray" className="font-bold">
                      {formatValue(totalValue)}
                    </Typography>
                  </div>
                </div>
                
                {/* Reserverade */}
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg p-3">
                    <PrinterIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <Typography variant="small" className="text-blue-gray-600">
                      Reserverade
                    </Typography>
                    <Typography variant="h5" color="blue-gray" className="font-bold">
                      {totalReserved.toString()}
                    </Typography>
                  </div>
                </div>
                
                {/* Lagning */}
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg p-3">
                    <PrinterIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <Typography variant="small" className="text-blue-gray-600">
                      Lagning
                    </Typography>
                    <Typography variant="h5" color="blue-gray" className="font-bold">
                      {allPrinters.filter(p => p.status === 'cancelled').length.toString()}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Search Section */}
              <div className="flex flex-col gap-2 w-1/3">
                <Typography variant="small" color="blue-gray" className="font-medium">
                  Sök skrivare:
                </Typography>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Sök på märke, modell, serienummer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="!border-blue-gray-200 focus:!border-blue-gray-200 w-full"
                    labelProps={{
                      className: "hidden",
                    }}
                    containerProps={{
                      className: "!min-w-0 before:!border-transparent after:!border-transparent",
                    }}
                  />
                  {searchQuery && (
                    <Button
                      variant="outlined"
                      color="gray"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="text-xs px-2 py-1"
                    >
                      Rensa
                    </Button>
                  )}
                </div>
                {searchQuery && (
                  <Typography variant="small" color="blue-gray" className="text-xs">
                    {(usedPrinters.length + newPrinters.length) > 0 ? 
                      `${usedPrinters.length + newPrinters.length} resultat` : 
                      'Inga resultat'
                    }
                  </Typography>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Begagnade skrivare i lager */}
      {renderPrinterTable(usedPrinters, "Begagnade skrivare i lager", "gray")}
      
      {/* Nya skrivare i lager */}
      {renderPrinterTable(newPrinters, "Nya skrivare i lager", "blue", true)}
      
    </div>
  );
}

export default Tables;
