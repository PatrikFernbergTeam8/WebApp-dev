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
} from "@material-tailwind/react";
import { EllipsisVerticalIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { BanknotesIcon, UsersIcon, UserPlusIcon, ChartBarIcon } from "@heroicons/react/24/solid";
import { printersInventoryData } from "@/data";
import React, { useState, useEffect } from "react";
import { StatisticsCard } from "@/widgets/cards";

// Import Google Sheets hook
import { useGoogleSheetsData, reservePrinterInSheet, unreservePrinterInSheet } from "@/services/googleSheets";

export function Tables() {
  // Use Google Sheets API - hooks must be called at top level
  const { data: liveData, loading, error, refetch } = useGoogleSheetsData();
  
  // Use live data if available, otherwise fall back to static data
  const allPrinters = liveData.length > 0 ? liveData : printersInventoryData;
  
  // Separate printers based on Reserverad_av column from Google Sheets
  const availablePrinters = allPrinters.filter(printer => !printer.reservedBy);
  const reservedPrinters = allPrinters.filter(printer => printer.reservedBy);
  
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
  
  // Function to reserve a printer by updating Google Sheets
  const reservePrinter = async (printer) => {
    try {
      const success = await reservePrinterInSheet(printer);
      if (success) {
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
  const totalPrinters = availablePrinters.length;
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
  console.log('Reserved printers:', reservedPrinters.length);
  console.log('Available printers:', availablePrinters.length);
  console.log('Total value:', totalValue);
  
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
  console.log('Using available data:', availablePrinters);
  
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
                {availablePrinters.filter(p => p.status === 'available').length}
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
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <div className="flex items-center justify-between">
            <Typography variant="h6" color="white">
              Skrivare i lager ({totalPrinters}) {loading && <Spinner className="ml-2 h-4 w-4" />}
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
                {["Märke/Modell", "Status", "Senaste kund", "Lagervärde", ""].map(
                  (el) => (
                    <th
                      key={el}
                      className="border-b border-blue-gray-50 py-3 px-5 text-left"
                    >
                      <Typography
                        variant="small"
                        className="text-[11px] font-bold uppercase text-blue-gray-400"
                      >
                        {el}
                      </Typography>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {availablePrinters.map(
                ({ brand, model, status, location, price, _rowNumber }, key) => {
                  const className = `py-3 px-5 ${
                    key === availablePrinters.length - 1
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

                  return (
                    <tr key={`${brand}-${model}-${key}`}>
                      <td className={className}>
                        <div>
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-semibold"
                          >
                            {brand}
                          </Typography>
                          <Typography className="text-xs font-normal text-blue-gray-500">
                            {model}
                          </Typography>
                        </div>
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
                        <Button
                          variant="gradient"
                          color="blue"
                          size="sm"
                          onClick={() => reservePrinter({ brand, model, status, location, price, _rowNumber })}
                          className="px-3 py-1"
                        >
                          Reservera
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
                  {["Märke/Modell", "Status", "Tid kvar", "Senaste kund", "Lagervärde", ""].map(
                    (el) => (
                      <th
                        key={el}
                        className="border-b border-blue-gray-50 py-3 px-5 text-left"
                      >
                        <Typography
                          variant="small"
                          className="text-[11px] font-bold uppercase text-blue-gray-400"
                        >
                          {el}
                        </Typography>
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {reservedPrinters.map(
                  ({ brand, model, status, location, price, reservedBy, _rowNumber }, key) => {
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

                    return (
                      <tr key={`reserved-${brand}-${model}-${key}`}>
                        <td className={className}>
                          <div>
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-semibold"
                            >
                              {brand}
                            </Typography>
                            <Typography className="text-xs font-normal text-blue-gray-500">
                              {model}
                            </Typography>
                          </div>
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
                            onClick={() => unreservePrinter({ brand, model, status, location, price, _rowNumber })}
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
