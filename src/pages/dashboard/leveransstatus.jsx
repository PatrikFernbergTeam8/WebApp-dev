import {
  Card,
  CardBody,
  Typography,
  Chip,
  Button,
  Spinner,
  Collapse,
} from "@material-tailwind/react";
import { TruckIcon, PhoneIcon, EnvelopeIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { CalendarDaysIcon, BuildingOfficeIcon, UserIcon } from "@heroicons/react/24/solid";
import React, { useState, useEffect } from "react";

// Import Trello service
import { useTrelloData } from "@/services/trelloService";

export function Leveransstatus() {
  const [expandedRows, setExpandedRows] = useState({});
  
  // Use Trello data hook
  const { data: trelloDeliveries, loading, error, refetch } = useTrelloData();

  // Use Trello data or fallback to empty array
  const deliveries = trelloDeliveries || [];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "nybeställning":
        return "blue";
      case "beställd":
        return "orange";
      case "begagnad":
        return "green";
      case "bokat&klart":
        return "purple";
      default:
        return "gray";
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="mb-8">

      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
        <div className="mb-8">
          <Typography variant="h4" color="blue-gray" className="font-bold">
            Pågående Leveranser ({deliveries.length})
          </Typography>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <Card className="overflow-hidden shadow-xl">
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <tbody>
                    {deliveries.map((delivery) => (
                      <React.Fragment key={delivery.id}>
                        {/* Main Row */}
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 border-b border-blue-gray-50 truncate">
                            <Typography variant="small" color="blue-gray" className="font-semibold truncate">
                              {delivery.customer}
                            </Typography>
                          </td>
                          <td className="p-3 border-b border-blue-gray-50 truncate">
                            <Typography variant="small" color="blue-gray" className="truncate">
                              {delivery.model || '-'}
                            </Typography>
                          </td>
                          <td className="p-3 border-b border-blue-gray-50">
                            <Chip
                              value={delivery.status}
                              color={getStatusColor(delivery.status)}
                              size="sm"
                              className="text-xs"
                            />
                          </td>
                          <td className="p-3 border-b border-blue-gray-50 truncate">
                            <Typography variant="small" color="blue-gray" className="truncate">
                              {delivery.desiredDate || '-'}
                            </Typography>
                          </td>
                          <td className="p-3 border-b border-blue-gray-50 truncate">
                            <Typography variant="small" color="blue-gray" className="truncate">
                              {delivery.seller || '-'}
                            </Typography>
                          </td>
                          <td className="p-3 border-b border-blue-gray-50">
                            <Button
                              variant="text"
                              size="sm"
                              onClick={() => toggleRow(delivery.id)}
                              className="p-1 hover:bg-blue-gray-50"
                            >
                              {expandedRows[delivery.id] ? (
                                <ChevronUpIcon className="h-4 w-4" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                        
                        {/* Expanded Details Row */}
                        <tr>
                          <td colSpan="6" className="p-0 border-b border-blue-gray-50">
                            <Collapse open={expandedRows[delivery.id]}>
                              <div className="bg-blue-gray-50/50 p-6 border-l-4 border-blue-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {/* Företagsinformation */}
                                  <div className="space-y-2">
                                    <Typography variant="small" className="font-bold text-blue-gray-700">
                                      Företagsinformation
                                    </Typography>
                                    <div className="flex items-center gap-2">
                                      <BuildingOfficeIcon className="w-4 h-4 text-blue-gray-500" />
                                      <Typography variant="small" className="text-blue-gray-600">
                                        {delivery.company}
                                      </Typography>
                                    </div>
                                    {delivery.address && (
                                      <div className="flex items-start gap-2">
                                        <TruckIcon className="w-4 h-4 text-blue-gray-500 mt-0.5" />
                                        <Typography variant="small" className="text-blue-gray-600">
                                          {delivery.address}
                                        </Typography>
                                      </div>
                                    )}
                                  </div>

                                  {/* Kontaktinformation */}
                                  <div className="space-y-2">
                                    <Typography variant="small" className="font-bold text-blue-gray-700">
                                      Kontaktinformation
                                    </Typography>
                                    {delivery.email && (
                                      <div className="flex items-center gap-2">
                                        <EnvelopeIcon className="w-4 h-4 text-blue-600" />
                                        <a
                                          href={`mailto:${delivery.email}`}
                                          className="text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                          <Typography variant="small">
                                            {delivery.email}
                                          </Typography>
                                        </a>
                                      </div>
                                    )}
                                    {delivery.phone && (
                                      <div className="flex items-center gap-2">
                                        <PhoneIcon className="w-4 h-4 text-green-600" />
                                        <a
                                          href={`tel:${delivery.phone}`}
                                          className="text-green-600 hover:text-green-800 transition-colors"
                                        >
                                          <Typography variant="small">
                                            {delivery.phone}
                                          </Typography>
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  {/* Status och anteckningar */}
                                  <div className="space-y-2">
                                    <Typography variant="small" className="font-bold text-blue-gray-700">
                                      Status och anteckningar
                                    </Typography>
                                    <Typography variant="small" className="text-blue-gray-600">
                                      <strong>Status:</strong> {delivery.listName}
                                    </Typography>
                                    {delivery.description && (
                                      <Typography variant="small" className="text-blue-gray-600 italic">
                                        <strong>Anteckningar:</strong> {delivery.description}
                                      </Typography>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Collapse>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        {!loading && deliveries.length === 0 && (
          <div className="text-center py-12">
            <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <Typography variant="h6" color="blue-gray" className="mb-2">
              Inga leveranser hittades
            </Typography>
            <Typography variant="paragraph" color="gray">
              Det finns för närvarande inga pågående leveranser.
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leveransstatus;