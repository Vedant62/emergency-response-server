import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

const activeAmbulance = new Map();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
//   console.log("socket: ", socket);

  socket.on("registerAmbulance", (ambulanceData) => {
    console.log("Succesfully registered!! ambulance got: ", ambulanceData);
    activeAmbulance.set(socket.id, {
      availability: "engaged",
      ...ambulanceData,
    });
    io.emit("ambulanceListUpdate", activeAmbulance);
  });

  socket.on("createEmergencyCase", (caseData) => {
    // const caseId = generateCaseId();
    // socket.join(`case_${caseId}`);
    console.log('successfully created new case: ', caseData);
    io.to("hospital_staff").emit("newEmergencyCase", {
      ...caseData,
    });
  });

  socket.on("updateVitals", (data) => {
    io.to(`hospital_staff`).emit("vitalsUpdate", {
      // timestamp: new Date(),
      ...data,
    });
  });

  socket.on("updateLocation", (locationData) => {
    console.log('location update: ', locationData);
    if (activeAmbulance.has(socket.id)) {
      activeAmbulance.location = locationData;
      io.to(`hospital_staff`).emit("ambulanceLocationUpdate", {
        ...locationData,
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
