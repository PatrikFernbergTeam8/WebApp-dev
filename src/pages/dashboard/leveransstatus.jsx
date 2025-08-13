import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Button,
  Spinner,
} from "@material-tailwind/react";
import { ArrowPathIcon, TruckIcon, PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { CalendarDaysIcon, BuildingOfficeIcon, UserIcon } from "@heroicons/react/24/solid";
import React, { useState, useEffect } from "react";

export function Leveransstatus() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data baserat på Trello-strukturen
  const mockDeliveries = [
    {
      id: "1",
      customer: "Spirande Lärande i Täby AB",
      company: "Spirande Lärande i Täby AB",
      model: "Epson AM-C4000 3st",
      address: "Eskadervägen 10",
      status: "Nybeställning",
      priority: "Övriga",
      desiredDate: "4 augusti",
      seller: "Michael Wreming",
      email: "hr@spiraskolan.se",
      phone: "0760043231",
      description: "SMTP: Ta reda på kundens SMTP-uppgifter",
      listName: "Ny leverans skapad"
    },
    {
      id: "2", 
      customer: "Svenska Mäklarhuset Haninge",
      company: "Svenska Mäklarhuset Haninge",
      model: "Ricoh",
      address: "",
      status: "Beställd",
      priority: "Övriga",
      desiredDate: "",
      seller: "",
      email: "",
      phone: "",
      description: "",
      listName: "Uppstartsmöte bokat"
    },
    {
      id: "3",
      customer: "CONVICTUS",
      company: "CONVICTUS", 
      model: "Ricoh",
      address: "",
      status: "Begagnad",
      priority: "Ricoh",
      desiredDate: "2025-08-22",
      seller: "",
      email: "",
      phone: "",
      description: "Länsfast Ludvika",
      listName: "Skrivare hos Safe och Prel. leveransdatum bokat"
    },
    {
      id: "4",
      customer: "Part Precision Sweden AB",
      company: "Part Precision Sweden AB",
      model: "",
      address: "",
      status: "Bokat&Klart",
      priority: "Begagnad",
      desiredDate: "2025-08-15",
      seller: "",
      email: "",
      phone: "",
      description: "Epson",
      listName: "Leveransdatum bekräftat"
    },
    {
      id: "5",
      customer: "Sjöbogården",
      company: "Sjöbogården",
      model: "",
      address: "",
      status: "Begagnad",
      priority: "Epson",
      desiredDate: "2025-07-29",
      seller: "",
      email: "",
      phone: "",
      description: "",
      listName: "Eftermarknad"
    }
  ];

  useEffect(() => {
    // Simulera API-anrop
    setTimeout(() => {
      setDeliveries(mockDeliveries);
      setLoading(false);
    }, 1000);
  }, []);

  const refetch = () => {
    setLoading(true);
    setTimeout(() => {
      setDeliveries(mockDeliveries);
      setLoading(false);
    }, 1000);
  };

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

  const getListColor = (listName) => {
    switch (listName) {
      case "Ny leverans skapad":
        return "bg-blue-50 border-blue-200";
      case "Uppstartsmöte bokat":
        return "bg-orange-50 border-orange-200";
      case "Skrivare hos Safe och Prel. leveransdatum bokat":
        return "bg-green-50 border-green-200";
      case "Leveransdatum bekräftat":
        return "bg-purple-50 border-purple-200";
      case "Eftermarknad":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="relative mb-12 py-20 w-full bg-[url('/img/background-image.png')] bg-cover bg-center">
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h2" className="font-bold text-white mb-4">
                Leveransstatus
              </Typography>
              <Typography variant="lead" className="text-white/80">
                Översikt över pågående leveranser och installationer
              </Typography>
            </div>
            <div className="flex items-center gap-4">
              <TruckIcon className="w-16 h-16 text-white/60" />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-blue-900/40 to-purple-900/50"></div>
      </div>

      {/* Delivery Cards */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <Typography variant="h4" color="blue-gray" className="font-bold">
            Pågående Leveranser ({deliveries.length})
          </Typography>
          <Button
            variant="outlined"
            color="blue-gray"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Uppdatera
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {deliveries.map((delivery) => (
              <Card key={delivery.id} className={`shadow-lg border-2 ${getListColor(delivery.listName)}`}>
                <CardHeader className="relative h-16 bg-gradient-to-r from-blue-600 to-purple-600">
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <Typography variant="h6" className="text-white font-bold truncate">
                      {delivery.customer}
                    </Typography>
                    <Chip
                      value={delivery.status}
                      color={getStatusColor(delivery.status)}
                      size="sm"
                      className="text-xs"
                    />
                  </div>
                </CardHeader>
                
                <CardBody className="p-4 space-y-3">
                  {/* Företagsinfo */}
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-blue-gray-500" />
                    <Typography variant="small" className="font-semibold text-blue-gray-800">
                      {delivery.company}
                    </Typography>
                  </div>

                  {/* Modell */}
                  {delivery.model && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <Typography variant="small" className="font-medium text-blue-gray-700">
                        Modell: {delivery.model}
                      </Typography>
                    </div>
                  )}

                  {/* Leveransadress */}
                  {delivery.address && (
                    <div className="flex items-start gap-2">
                      <TruckIcon className="w-4 h-4 text-blue-gray-500 mt-0.5" />
                      <Typography variant="small" className="text-blue-gray-600">
                        {delivery.address}
                      </Typography>
                    </div>
                  )}

                  {/* Önskat datum */}
                  {delivery.desiredDate && (
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4 text-blue-gray-500" />
                      <Typography variant="small" className="text-blue-gray-600">
                        Leverans: {delivery.desiredDate}
                      </Typography>
                    </div>
                  )}

                  {/* Säljare */}
                  {delivery.seller && (
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-blue-gray-500" />
                      <Typography variant="small" className="text-blue-gray-600">
                        Säljare: {delivery.seller}
                      </Typography>
                    </div>
                  )}

                  {/* Kontaktinfo */}
                  <div className="flex items-center gap-4 pt-2">
                    {delivery.email && (
                      <a
                        href={`mailto:${delivery.email}`}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <EnvelopeIcon className="w-4 h-4" />
                        <Typography variant="small">E-post</Typography>
                      </a>
                    )}
                    {delivery.phone && (
                      <a
                        href={`tel:${delivery.phone}`}
                        className="flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors"
                      >
                        <PhoneIcon className="w-4 h-4" />
                        <Typography variant="small">Ring</Typography>
                      </a>
                    )}
                  </div>

                  {/* Beskrivning */}
                  {delivery.description && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Typography variant="small" className="text-blue-gray-600 italic">
                        {delivery.description}
                      </Typography>
                    </div>
                  )}

                  {/* Status lista */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Typography variant="small" className="font-medium text-blue-gray-500">
                      Status: {delivery.listName}
                    </Typography>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
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