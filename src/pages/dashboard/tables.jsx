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
import { BanknotesIcon, UsersIcon, UserPlusIcon, ChartBarIcon } from "@heroicons/react/24/solid";
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
  
  // Separate and sort printers based on condition and reservation status
  const usedPrinters = sortPrinters(allPrinters.filter(printer => !printer.reservedBy && printer.condition === 'used'));
  const newPrinters = sortPrinters(allPrinters.filter(printer => !printer.reservedBy && printer.condition === 'new'));
  const reservedPrinters = sortPrinters(allPrinters.filter(printer => printer.reservedBy));
  
  // Function to calculate time remaining
  const getTimeRemaining = (reservedAt) => {
    const now = new Date();
    const reservedDate = new Date(reservedAt);
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000; // 2 weeks in milliseconds
    const expirationDate = new Date(reservedDate.getTime() + twoWeeksInMs);
    const timeLeft = expirationDate - now;
    
    if (timeLeft <= 0) {
      return { expired: true, text: "Utgången" };
    }
    
    const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return { expired: false, text: `${days} dag${days !== 1 ? 'ar' : ''} kvar` };
    } else {
      return { expired: false, text: `${hours} timm${hours !== 1 ? 'ar' : 'e'} kvar` };
    }
  };
  
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
  const totalReserved = reservedPrinters.length;
  
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
  const renderPrinterTable = (printers, title, headerColor = "gray") => {
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
                  { label: "Senaste kund", key: "location" },
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
                ({ brand, model, status, location, price, serialNumber, _rowNumber }, key) => {
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
                          {location}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {price}
                        </Typography>
                      </td>
                      <td className={className}>
                        {status === 'available' ? (
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
      {/* Statistics Cards */}
      <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        <StatisticsCard
          color="gray"
          icon={React.createElement(ChartBarIcon, {
            className: "w-6 h-6 text-white",
          })}
          title="Antal skrivare i lager"
          value={totalPrinters.toString()}
          footer={
            <Typography className="font-normal text-blue-gray-600">
              <strong className="text-green-500">
                {allPrinters.filter(p => p.status === 'available' && !p.reservedBy).length}
              </strong>
              &nbsp;tillgängliga
            </Typography>
          }
        />
        <StatisticsCard
          color="gray"
          icon={React.createElement(BanknotesIcon, {
            className: "w-6 h-6 text-white",
          })}
          title="Totalt lagervärde"
          value={formatValue(totalValue)}
          footer={
            <Typography className="font-normal text-blue-gray-600">
              <strong className="text-blue-500">
                {allPrinters.length}
              </strong>
              &nbsp;skrivare totalt
            </Typography>
          }
        />
        <StatisticsCard
          color="gray"
          icon={React.createElement(UserPlusIcon, {
            className: "w-6 h-6 text-white",
          })}
          title="Antal reserverade skrivare"
          value={totalReserved.toString()}
          footer={
            <Typography className="font-normal text-blue-gray-600">
              <strong className="text-orange-500">
                {totalReserved > 0 ? `${((totalReserved / totalPrinters) * 100).toFixed(1)}%` : '0%'}
              </strong>
              &nbsp;av totalt lager
            </Typography>
          }
        />
        <StatisticsCard
          color="gray"
          icon={React.createElement(UsersIcon, {
            className: "w-6 h-6 text-white",
          })}
          title="Under lagning"
          value={allPrinters.filter(p => p.status === 'cancelled').length.toString()}
          footer={
            <Typography className="font-normal text-blue-gray-600">
              <strong className="text-red-500">
                {allPrinters.filter(p => p.status === 'pending').length}
              </strong>
              &nbsp;inväntar rekond
            </Typography>
          }
        />
      </div>
      
      {/* Begagnade skrivare i lager */}
      {renderPrinterTable(usedPrinters, "Begagnade skrivare i lager", "gray")}
      
      {/* Nya skrivare i lager */}
      {renderPrinterTable(newPrinters, "Nya skrivare i lager", "blue")}
      
      {/* Reserved Printers Table */}
      {reservedPrinters.length > 0 && (
        <Card>
          <CardHeader variant="gradient" color="orange" className="mb-8 p-6">
            <Typography variant="h6" color="white">
              Reserverade skrivare ({reservedPrinters.length})
            </Typography>
          </CardHeader>
          <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {[
                    { label: "Märke/Modell", key: "brandModel" },
                    { label: "Serienummer", key: "serialNumber" },
                    { label: "Status", key: "status" },
                    { label: "Säljare", key: "sellerName" },
                    { label: "Tid kvar", key: null },
                    { label: "Senaste kund", key: "location" },
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
                {reservedPrinters.map(
                  ({ brand, model, status, location, price, serialNumber, sellerName, reservedBy, _rowNumber }, key) => {
                    const className = `py-3 px-5 ${
                      key === reservedPrinters.length - 1
                        ? ""
                        : "border-b border-blue-gray-50"
                    }`;

                    // Parse reservation date from reservedBy text (format: "Reserverad till YYYY-MM-DD")
                    const reservationDate = reservedBy.includes('till') ? reservedBy.split('till ')[1] : '';
                    const timeRemaining = reservationDate ? getTimeRemaining(reservationDate) : { expired: false, text: 'Okänt' };

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
                      <tr key={`reserved-${brand}-${model}-${key}`}>
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
                            color="orange"
                            value="Reserverad"
                            className="py-0.5 px-2 text-[11px] font-medium w-fit"
                          />
                        </td>
                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {sellerName || '-'}
                          </Typography>
                        </td>
                        <td className={className}>
                          <Typography 
                            className={`text-xs font-semibold ${timeRemaining.expired ? 'text-red-600' : 'text-blue-gray-600'}`}
                          >
                            {timeRemaining.text}
                          </Typography>
                        </td>
                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {location}
                          </Typography>
                        </td>
                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {price}
                          </Typography>
                        </td>
                        <td className={className}>
                          <Button
                            variant="outlined"
                            color="red"
                            size="sm"
                            onClick={() => unreservePrinter({ brand, model, status, location, price, serialNumber, sellerName, _rowNumber })}
                            className="px-3 py-1"
                          >
                            Avreservera
                          </Button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default Tables;
