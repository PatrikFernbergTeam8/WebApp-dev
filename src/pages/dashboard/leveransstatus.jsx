import {
  Typography,
} from "@material-tailwind/react";
import React from "react";

export function Leveransstatus() {
  return (
    <div className="mb-8">
      {/* Empty page - ready for development */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Typography variant="h5" color="blue-gray" className="mb-2">
            Leveransstatus
          </Typography>
          <Typography variant="paragraph" color="gray" className="text-sm">
            Denna sida är tom och redo för utveckling.
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default Leveransstatus;