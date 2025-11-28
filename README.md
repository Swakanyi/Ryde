# Ryde - Ride-Hailing & Parcel Delivery App

A full-stack, Uber-inspired ride-hailing application built with modern web technologies. Ryde connects passengers with drivers for on-demand transportation and courier services, featuring real-time tracking, dynamic pricing, and an intuitive user interface.

## Features

### For Passengers
- **Book Rides**: Request a ride or courier service with a few taps.
- **Real-Time Tracking**: Live tracking of driver location on an interactive map.
- **Fare Estimation**: See the estimated fare and trip details before booking.
- **Multiple Vehicle Options**: Choose from economy, premium, and boda (motorcycle) options.
- **Courier Services**: Send packages with detailed delivery instructions.
- **Trip History**: View your complete ride and delivery history.
- **Secure Payments**: Integrated payment system for cashless transactions.

### For Drivers
- **Ride Management**: Accept or decline incoming ride requests.
- **Earnings Dashboard**: Track your daily and weekly earnings and completed trips.
- **Navigation Integration**: Built-in navigation to pickup and dropoff locations.
- **Online/Offline Toggle**: Go on/off duty with a single tap.

### General
- **User Authentication**: Secure login and registration for passengers and drivers.
- **Real-Time Notifications**: Instant updates for ride status, messages, and driver assignments.
- **Admin Panel**: Manage users, rides, and platform operations.

## Tech Stack

- **Frontend**: React, React Leaflet (for maps), Tailwind CSS
- **Backend**: Django, Django REST Framework
- **Database**: SQLite
- **Real-Time Communication**: WebSockets (via Django Channels)
- **Authentication**: JWT (JSON Web Tokens)
- **Maps & Geocoding**: Google Maps API
