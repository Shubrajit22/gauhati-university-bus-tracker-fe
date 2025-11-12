// src/data/driverData.js

export const drivers = [
  {
    username: "driver1",
    password: "1234",
    name: "Rohit Das",
    assignedBuses: [
      {
        busId: "GU001",
        name: "AT7 Boys Hall to Chandmari",
        route: "AT7 Boys Hall → Chandmari",
        currentStop: "Maligaon Station",
        nextStop: "Kamakhya Temple",
        totalStops: 10,
        progress: 5,
        status: "Mid Route",
      },
    ],
  },
  {
    username: "driver2",
    password: "5678",
    name: "Priya Sharma",
    assignedBuses: [
      {
        busId: "GU002",
        name: "AT5 Girls Hostel to Uzanbazar",
        route: "AT5 Girls Hostel → Uzanbazar",
        currentStop: "Bharalumukh",
        nextStop: "Fancy Bazaar",
        totalStops: 9,
        progress: 6,
        status: "Mid Route",
      },
      {
        busId: "GU003",
        name: "Science Block to Khanapara",
        route: "Science Block → Khanapara",
        currentStop: "Zoo Road",
        nextStop: "Khanapara Gate",
        totalStops: 11,
        progress: 8,
        status: "Mid Route",
      },
    ],
  },
];
