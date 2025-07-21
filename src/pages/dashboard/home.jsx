import React from "react";
import {
  Typography,
  Card,
  CardBody,
} from "@material-tailwind/react";
import {
  PhoneIcon,
  PrinterIcon,
  ComputerDesktopIcon,
  TvIcon,
} from "@heroicons/react/24/solid";

export function Home() {
  return (
    <div className="mt-12 max-w-4xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center mb-12">
        <Typography variant="h2" color="blue-gray" className="mb-4">
          Välkommen till Status Page
        </Typography>
        <Typography variant="lead" className="text-blue-gray-600">
          Företagets interna dashboard för avdelningsöversikt och leveransstatus
        </Typography>
      </div>

      {/* Main Description Card */}
      <Card className="mb-8">
        <CardBody className="p-8">
          <Typography variant="h4" color="blue-gray" className="mb-6">
            Om denna hemsida
          </Typography>
          <Typography className="text-lg mb-6 text-blue-gray-700 leading-relaxed">
            Denna hemsida är skapad för att vi internt på företaget ska få bättre koll på 
            vad som händer på respektive avdelningar. Här kan vi följa leveransstatus på våra 
            leveranser i de olika affärsområdena samt få en överblick av våra lagerstatusar 
            och andra viktiga dashboards.
          </Typography>
          <Typography className="text-lg text-blue-gray-700 leading-relaxed">
            Detta är ett extra komplement till vårt intranät och ger oss en samlad bild 
            av företagets olika verksamhetsområden på ett enkelt och överskådligt sätt.
          </Typography>
        </CardBody>
      </Card>

      {/* Business Areas */}
      <div className="mb-8">
        <Typography variant="h4" color="blue-gray" className="mb-6 text-center">
          Våra Affärsområden
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Telefoni */}
          <Card className="text-center">
            <CardBody className="p-6">
              <PhoneIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <Typography variant="h5" color="blue-gray" className="mb-2">
                Telefoni
              </Typography>
              <Typography className="text-blue-gray-600">
                Telefonilösningar och kommunikationssystem
              </Typography>
            </CardBody>
          </Card>

          {/* Print */}
          <Card className="text-center">
            <CardBody className="p-6">
              <PrinterIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <Typography variant="h5" color="blue-gray" className="mb-2">
                Print
              </Typography>
              <Typography className="text-blue-gray-600">
                Skrivare och utskriftslösningar
              </Typography>
            </CardBody>
          </Card>

          {/* Microsoft */}
          <Card className="text-center">
            <CardBody className="p-6">
              <ComputerDesktopIcon className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <Typography variant="h5" color="blue-gray" className="mb-2">
                Microsoft
              </Typography>
              <Typography className="text-blue-gray-600">
                Microsoft-lösningar och molntjänster
              </Typography>
            </CardBody>
          </Card>

          {/* AV/Digital Skyltning */}
          <Card className="text-center">
            <CardBody className="p-6">
              <TvIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <Typography variant="h5" color="blue-gray" className="mb-2">
                AV/Digital Skyltning
              </Typography>
              <Typography className="text-blue-gray-600">
                Audiovisuella lösningar och digital skyltning
              </Typography>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Features Card */}
      <Card>
        <CardBody className="p-8">
          <Typography variant="h4" color="blue-gray" className="mb-6">
            Vad du kan förvänta dig
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-3">
                📊 Lagerstatusar
              </Typography>
              <Typography className="text-blue-gray-600 mb-4">
                Realtidsöversikt av lagersaldo och produkttillgänglighet
              </Typography>
            </div>
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-3">
                🚚 Leveransstatus
              </Typography>
              <Typography className="text-blue-gray-600 mb-4">
                Spåra leveranser och projekt i alla affärsområden
              </Typography>
            </div>
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-3">
                📈 Dashboards
              </Typography>
              <Typography className="text-blue-gray-600 mb-4">
                Interaktiva dashboards med nyckeltal och statistik
              </Typography>
            </div>
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-3">
                🔄 Avdelningsöversikt
              </Typography>
              <Typography className="text-blue-gray-600 mb-4">
                Få insyn i vad som händer på olika avdelningar
              </Typography>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Home;
