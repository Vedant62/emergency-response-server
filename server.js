import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

const activeAmbulance = new Map();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("registerAmbulance", ({ ambulanceId, ambulanceData }) => {
    socket.ambulanceId = ambulanceId;
    console.log("Succesfully registered!! ambulance got: ", {
      ambulanceId: socket.ambulanceId,
      ambulanceData,
    });
    io.emit("ambulanceListUpdate", {
      ambulanceId: socket.ambulanceId,
      ambulanceData,
    });
  });

  socket.on("joinRoom", (roomData) => {
    socket.join(roomData.roomId);
  });

  socket.on("createEmergencyCase", (caseData) => {
    const ambulanceId = socket.ambulanceId;
    console.log("successfully created new case: ", {
      caseId: socket.currentCase,
      ambulanceId,
      caseData,
    });
    io.to("hospital_staff").emit("newEmergencyCase", {
      caseId: socket.currentCase,
      ambulanceId,
      caseData,
    });
  });

  socket.on("updateVitals", (vitalsData) => {
    const ambulanceId = socket.ambulanceId;
    const caseId = socket.currentCase;
    console.log("vitals got: ", {
      ambulanceId,
      caseId,
      vitalsData,
    });
    io.to(`hospital_staff`).emit("vitalsUpdate", {
      ambulanceId,
      caseId,
      vitalsData,
    });
  });

  socket.on("setCase", (caseId) => {
    socket.currentCase = caseId.case;
  });

  socket.on("updateLocation", (locationData) => {
    const ambulanceId = socket.ambulanceId;
    console.log("location update: ", {
      ambulanceId,
      locationData,
    });
    if (activeAmbulance.has(socket.id)) {
      activeAmbulance.location = locationData;
      io.to(`hospital_staff`).emit("ambulanceLocationUpdate", {
        ambulanceId,
        locationData,
      });
    }
  });

  socket.on("disconnect", () => {
    if (activeAmbulance.has(socket.id)) {
      activeAmbulance.delete(socket.id);
      io.emit("ambulanceListUpdate", activeAmbulance);
    }
    console.log("now active ambulance: ", activeAmbulance);
    console.log("socket disconnected");
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
