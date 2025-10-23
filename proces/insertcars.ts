import { config } from "../APP/configs/config";
import mongoose from 'mongoose';

// Definir el esquema para los vehículos
const vehicleSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  año: { type: String, required: true },
  precio: { type: String, required: true },
  estado: { type: String, required: true },
  kilometraje: { type: String, required: true },
  color: { type: String, required: true },
  image: { type: String, required: true }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Crear el modelo
const Vehicle = mongoose.model('Car', vehicleSchema, 'cars');

const vehicles = [
    {
      id: 1,
      marca: 'Toyota',
      modelo: 'Camry',
      año: '2024',
      precio: 'Q195,000',
      estado: 'Disponible',
      kilometraje: '15,000 km',
      color: 'Blanco',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      marca: 'Honda',
      modelo: 'Civic Sport',
      año: '2023',
      precio: 'Q175,500',
      estado: 'Disponible',
      kilometraje: '8,500 km',
      color: 'Rojo',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      marca: 'BMW',
      modelo: 'X3 xDrive30i',
      año: '2024',
      precio: 'Q350,000',
      estado: 'Vendido',
      kilometraje: '12,000 km',
      color: 'Negro',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      marca: 'Mercedes-Benz',
      modelo: 'C-Class',
      año: '2023',
      precio: 'Q296,000',
      estado: 'En mantenimiento',
      kilometraje: '18,000 km',
      color: 'Gris',
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop'
    },
    {
      id: 5,
      marca: 'Audi',
      modelo: 'A4 Premium',
      año: '2024',
      precio: 'Q285,000',
      estado: 'Disponible',
      kilometraje: '9,200 km',
      color: 'Plata',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop'
    },
    {
      id: 6,
      marca: 'Volkswagen',
      modelo: 'Tiguan R-Line',
      año: '2023',
      precio: 'Q220,000',
      estado: 'Disponible',
      kilometraje: '14,500 km',
      color: 'Azul',
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop'
    },
    {
      id: 7,
      marca: 'Lexus',
      modelo: 'RX 350',
      año: '2024',
      precio: 'Q420,000',
      estado: 'Disponible',
      kilometraje: '7,800 km',
      color: 'Negro',
      image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
    },
    {
      id: 8,
      marca: 'Mazda',
      modelo: 'CX-5 Signature',
      año: '2023',
      precio: 'Q198,000',
      estado: 'Vendido',
      kilometraje: '11,300 km',
      color: 'Blanco',
      image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop'
    },
    {
      id: 9,
      marca: 'Hyundai',
      modelo: 'Tucson Limited',
      año: '2024',
      precio: 'Q185,000',
      estado: 'Disponible',
      kilometraje: '6,700 km',
      color: 'Gris',
      image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
    },
    {
      id: 10,
      marca: 'Kia',
      modelo: 'Sportage EX',
      año: '2023',
      precio: 'Q172,000',
      estado: 'En mantenimiento',
      kilometraje: '13,900 km',
      color: 'Rojo',
      image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
    },
    {
      id: 11,
      marca: 'Subaru',
      modelo: 'Outback Touring',
      año: '2024',
      precio: 'Q205,000',
      estado: 'Disponible',
      kilometraje: '8,100 km',
      color: 'Verde',
      image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
    },
    {
      id: 12,
      marca: 'Nissan',
      modelo: 'Rogue Platinum',
      año: '2023',
      precio: 'Q190,000',
      estado: 'Disponible',
      kilometraje: '16,200 km',
      color: 'Azul',
      image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
    },
    {
      id: 13,
      marca: 'Ford',
      modelo: 'Mustang GT',
      año: '2024',
      precio: 'Q280,000',
      estado: 'Vendido',
      kilometraje: '5,200 km',
      color: 'Amarillo',
      image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
    },
    {
      id: 14,
      marca: 'Chevrolet',
      modelo: 'Silverado 1500',
      año: '2023',
      precio: 'Q320,000',
      estado: 'Disponible',
      kilometraje: '22,100 km',
      color: 'Blanco',
      image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
    },
    {
      id: 15,
      marca: 'Dodge',
      modelo: 'Challenger SRT',
      año: '2024',
      precio: 'Q310,000',
      estado: 'Disponible',
      kilometraje: '3,800 km',
      color: 'Naranja',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop'
    },
    {
      id: 16,
      marca: 'Jeep',
      modelo: 'Wrangler Sahara',
      año: '2023',
      precio: 'Q265,000',
      estado: 'Vendido',
      kilometraje: '19,500 km',
      color: 'Verde',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
    },
    {
      id: 17,
      marca: 'Ram',
      modelo: '1500 Laramie',
      año: '2024',
      precio: 'Q340,000',
      estado: 'Disponible',
      kilometraje: '11,700 km',
      color: 'Gris',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop'
    },
    {
      id: 18,
      marca: 'GMC',
      modelo: 'Sierra Denali',
      año: '2023',
      precio: 'Q380,000',
      estado: 'En mantenimiento',
      kilometraje: '16,800 km',
      color: 'Negro',
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop'
    },
    {
      id: 19,
      marca: 'Cadillac',
      modelo: 'Escalade',
      año: '2024',
      precio: 'Q520,000',
      estado: 'Disponible',
      kilometraje: '8,900 km',
      color: 'Blanco',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop'
    },
    {
      id: 20,
      marca: 'Buick',
      modelo: 'Enclave',
      año: '2023',
      precio: 'Q240,000',
      estado: 'Vendido',
      kilometraje: '14,200 km',
      color: 'Azul',
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop'
    }, 
    {
        id: 21,
        marca: 'Lincoln',
        modelo: 'Navigator',
        año: '2024',
        precio: 'Q480,000',
        estado: 'Disponible',
        kilometraje: '6,300 km',
        color: 'Negro',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
      },
      {
        id: 22,
        marca: 'Acura',
        modelo: 'MDX Type S',
        año: '2023',
        precio: 'Q360,000',
        estado: 'Vendido',
        kilometraje: '12,600 km',
        color: 'Blanco',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 23,
        marca: 'Infiniti',
        modelo: 'QX60',
        año: '2024',
        precio: 'Q290,000',
        estado: 'En mantenimiento',
        kilometraje: '9,800 km',
        color: 'Gris',
        image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop'
      },
      {
        id: 24,
        marca: 'Volvo',
        modelo: 'XC90 Recharge',
        año: '2023',
        precio: 'Q450,000',
        estado: 'Disponible',
        kilometraje: '7,400 km',
        color: 'Azul',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 25,
        marca: 'Jaguar',
        modelo: 'F-Pace',
        año: '2024',
        precio: 'Q380,000',
        estado: 'Disponible',
        kilometraje: '5,600 km',
        color: 'Plata',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
      },
      {
        id: 26,
        marca: 'Land Rover',
        modelo: 'Range Rover',
        año: '2023',
        precio: 'Q680,000',
        estado: 'Vendido',
        kilometraje: '13,200 km',
        color: 'Verde',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 27,
        marca: 'Porsche',
        modelo: '911 Carrera',
        año: '2024',
        precio: 'Q720,000',
        estado: 'Disponible',
        kilometraje: '2,100 km',
        color: 'Rojo',
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop'
      },
      {
        id: 28,
        marca: 'Porsche',
        modelo: 'Cayenne',
        año: '2023',
        precio: 'Q580,000',
        estado: 'En mantenimiento',
        kilometraje: '8,700 km',
        color: 'Negro',
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
      },
      {
        id: 29,
        marca: 'Ferrari',
        modelo: 'F8 Tributo',
        año: '2024',
        precio: 'Q1,200,000',
        estado: 'Disponible',
        kilometraje: '1,500 km',
        color: 'Rojo',
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop'
      },
      {
        id: 30,
        marca: 'Lamborghini',
        modelo: 'Huracán',
        año: '2023',
        precio: 'Q1,500,000',
        estado: 'Vendido',
        kilometraje: '3,200 km',
        color: 'Amarillo',
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop'
      },
      {
        id: 31,
        marca: 'McLaren',
        modelo: '720S',
        año: '2024',
        precio: 'Q1,800,000',
        estado: 'Disponible',
        kilometraje: '800 km',
        color: 'Naranja',
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop'
      },
      {
        id: 32,
        marca: 'Aston Martin',
        modelo: 'DB11',
        año: '2023',
        precio: 'Q1,100,000',
        estado: 'En mantenimiento',
        kilometraje: '4,600 km',
        color: 'Azul',
        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop'
      },
      {
        id: 33,
        marca: 'Bentley',
        modelo: 'Continental GT',
        año: '2024',
        precio: 'Q1,400,000',
        estado: 'Disponible',
        kilometraje: '2,300 km',
        color: 'Blanco',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
      },
      {
        id: 34,
        marca: 'Rolls-Royce',
        modelo: 'Phantom',
        año: '2023',
        precio: 'Q2,500,000',
        estado: 'Disponible',
        kilometraje: '1,800 km',
        color: 'Negro',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 35,
        marca: 'Maserati',
        modelo: 'Ghibli',
        año: '2024',
        precio: 'Q520,000',
        estado: 'Vendido',
        kilometraje: '6,900 km',
        color: 'Gris',
        image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop'
      },
      {
        id: 36,
        marca: 'Alfa Romeo',
        modelo: 'Giulia',
        año: '2023',
        precio: 'Q280,000',
        estado: 'Disponible',
        kilometraje: '15,400 km',
        color: 'Rojo',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 37,
        marca: 'Fiat',
        modelo: '500X',
        año: '2024',
        precio: 'Q165,000',
        estado: 'Disponible',
        kilometraje: '10,200 km',
        color: 'Blanco',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
      },
      {
        id: 38,
        marca: 'Peugeot',
        modelo: '3008',
        año: '2023',
        precio: 'Q180,000',
        estado: 'En mantenimiento',
        kilometraje: '12,800 km',
        color: 'Azul',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 39,
        marca: 'Renault',
        modelo: 'Captur',
        año: '2024',
        precio: 'Q155,000',
        estado: 'Disponible',
        kilometraje: '8,900 km',
        color: 'Gris',
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop'
      },
      {
        id: 40,
        marca: 'Citroën',
        modelo: 'C5 Aircross',
        año: '2023',
        precio: 'Q170,000',
        estado: 'Vendido',
        kilometraje: '11,600 km',
        color: 'Blanco',
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
      },
      {
        id: 41,
        marca: 'Opel',
        modelo: 'Mokka',
        año: '2024',
        precio: 'Q160,000',
        estado: 'Disponible',
        kilometraje: '7,300 km',
        color: 'Rojo',
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop'
      },
      {
        id: 42,
        marca: 'Seat',
        modelo: 'Arona',
        año: '2023',
        precio: 'Q145,000',
        estado: 'Vendido',
        kilometraje: '14,700 km',
        color: 'Azul',
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop'
      },
      {
        id: 43,
        marca: 'Skoda',
        modelo: 'Kodiaq',
        año: '2024',
        precio: 'Q200,000',
        estado: 'Disponible',
        kilometraje: '9,100 km',
        color: 'Negro',
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop'
      },
      {
        id: 44,
        marca: 'Škoda',
        modelo: 'Octavia',
        año: '2023',
        precio: 'Q175,000',
        estado: 'En mantenimiento',
        kilometraje: '16,300 km',
        color: 'Gris',
        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop'
      },
      {
        id: 45,
        marca: 'Mini',
        modelo: 'Cooper S',
        año: '2024',
        precio: 'Q220,000',
        estado: 'Disponible',
        kilometraje: '6,800 km',
        color: 'Blanco',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
      },
      {
        id: 46,
        marca: 'Mini',
        modelo: 'Countryman',
        año: '2023',
        precio: 'Q240,000',
        estado: 'Disponible',
        kilometraje: '13,500 km',
        color: 'Verde',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 47,
        marca: 'Smart',
        modelo: 'Fortwo',
        año: '2024',
        precio: 'Q120,000',
        estado: 'Vendido',
        kilometraje: '4,200 km',
        color: 'Amarillo',
        image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop'
      },
      {
        id: 48,
        marca: 'Smart',
        modelo: 'Forfour',
        año: '2023',
        precio: 'Q130,000',
        estado: 'Disponible',
        kilometraje: '8,900 km',
        color: 'Plata',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 49,
        marca: 'Suzuki',
        modelo: 'Swift',
        año: '2024',
        precio: 'Q140,000',
        estado: 'En mantenimiento',
        kilometraje: '11,200 km',
        color: 'Rojo',
        image: 'https://images.unsplash.com/photo-1544636331-bd32c8ce0db2?w=400&h=300&fit=crop'
      },
      {
        id: 50,
        marca: 'Suzuki',
        modelo: 'Vitara',
        año: '2023',
        precio: 'Q160,000',
        estado: 'Disponible',
        kilometraje: '15,800 km',
        color: 'Azul',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 51,
        marca: 'Mitsubishi',
        modelo: 'Eclipse Cross',
        año: '2024',
        precio: 'Q170,000',
        estado: 'Disponible',
        kilometraje: '7,600 km',
        color: 'Gris',
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop'
      },
      {
        id: 52,
        marca: 'Mitsubishi',
        modelo: 'Outlander',
        año: '2023',
        precio: 'Q185,000',
        estado: 'Vendido',
        kilometraje: '12,400 km',
        color: 'Negro',
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
      },
      {
        id: 53,
        marca: 'Isuzu',
        modelo: 'D-Max',
        año: '2024',
        precio: 'Q210,000',
        estado: 'Disponible',
        kilometraje: '18,900 km',
        color: 'Blanco',
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop'
      },
      {
        id: 54,
        marca: 'Isuzu',
        modelo: 'MU-X',
        año: '2023',
        precio: 'Q230,000',
        estado: 'Disponible',
        kilometraje: '14,600 km',
        color: 'Azul',
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop'
      },
      {
        id: 55,
        marca: 'Daihatsu',
        modelo: 'Terios',
        año: '2024',
        precio: 'Q135,000',
        estado: 'En mantenimiento',
        kilometraje: '9,800 km',
        color: 'Verde',
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop'
      },
      {
        id: 56,
        marca: 'Daihatsu',
        modelo: 'Rocky',
        año: '2023',
        precio: 'Q145,000',
        estado: 'Disponible',
        kilometraje: '13,200 km',
        color: 'Rojo',
        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop'
      },
      {
        id: 57,
        marca: 'Proton',
        modelo: 'X50',
        año: '2024',
        precio: 'Q150,000',
        estado: 'Disponible',
        kilometraje: '6,500 km',
        color: 'Negro',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
      },
      {
        id: 58,
        marca: 'Proton',
        modelo: 'X70',
        año: '2023',
        precio: 'Q165,000',
        estado: 'Vendido',
        kilometraje: '10,700 km',
        color: 'Plata',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 59,
        marca: 'Perodua',
        modelo: 'Myvi',
        año: '2024',
        precio: 'Q125,000',
        estado: 'Disponible',
        kilometraje: '8,400 km',
        color: 'Blanco',
        image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop'
      },
      {
        id: 60,
        marca: 'Perodua',
        modelo: 'Aruz',
        año: '2023',
        precio: 'Q140,000',
        estado: 'En mantenimiento',
        kilometraje: '12,100 km',
        color: 'Gris',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 61,
        marca: 'Great Wall',
        modelo: 'Haval H6',
        año: '2024',
        precio: 'Q180,000',
        estado: 'Disponible',
        kilometraje: '5,900 km',
        color: 'Gris',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
      },
      {
        id: 62,
        marca: 'Great Wall',
        modelo: 'Haval Jolion',
        año: '2023',
        precio: 'Q160,000',
        estado: 'Vendido',
        kilometraje: '11,800 km',
        color: 'Rojo',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 63,
        marca: 'Chery',
        modelo: 'Tiggo 7',
        año: '2024',
        precio: 'Q170,000',
        estado: 'Disponible',
        kilometraje: '7,200 km',
        color: 'Blanco',
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop'
      },
      {
        id: 64,
        marca: 'Chery',
        modelo: 'Tiggo 8',
        año: '2023',
        precio: 'Q190,000',
        estado: 'En mantenimiento',
        kilometraje: '14,300 km',
        color: 'Negro',
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
      },
      {
        id: 65,
        marca: 'Geely',
        modelo: 'Coolray',
        año: '2024',
        precio: 'Q155,000',
        estado: 'Disponible',
        kilometraje: '9,600 km',
        color: 'Azul',
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop'
      },
      {
        id: 66,
        marca: 'Geely',
        modelo: 'Azkarra',
        año: '2023',
        precio: 'Q175,000',
        estado: 'Vendido',
        kilometraje: '13,700 km',
        color: 'Plata',
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop'
      },
      {
        id: 67,
        marca: 'MG',
        modelo: 'ZS',
        año: '2024',
        precio: 'Q160,000',
        estado: 'Disponible',
        kilometraje: '6,800 km',
        color: 'Rojo',
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop'
      },
      {
        id: 68,
        marca: 'MG',
        modelo: 'HS',
        año: '2023',
        precio: 'Q185,000',
        estado: 'En mantenimiento',
        kilometraje: '12,900 km',
        color: 'Negro',
        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop'
      },
      {
        id: 69,
        marca: 'BYD',
        modelo: 'Atto 3',
        año: '2024',
        precio: 'Q220,000',
        estado: 'Disponible',
        kilometraje: '4,500 km',
        color: 'Blanco',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
      },
      {
        id: 70,
        marca: 'BYD',
        modelo: 'Dolphin',
        año: '2023',
        precio: 'Q200,000',
        estado: 'Vendido',
        kilometraje: '8,200 km',
        color: 'Azul',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 71,
        marca: 'Tesla',
        modelo: 'Model 3',
        año: '2024',
        precio: 'Q380,000',
        estado: 'Disponible',
        kilometraje: '3,100 km',
        color: 'Rojo',
        image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop'
      },
      {
        id: 72,
        marca: 'Tesla',
        modelo: 'Model Y',
        año: '2023',
        precio: 'Q420,000',
        estado: 'Disponible',
        kilometraje: '7,800 km',
        color: 'Negro',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 73,
        marca: 'Tesla',
        modelo: 'Model S',
        año: '2024',
        precio: 'Q680,000',
        estado: 'En mantenimiento',
        kilometraje: '2,400 km',
        color: 'Gris',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
      },
      {
        id: 74,
        marca: 'Tesla',
        modelo: 'Model X',
        año: '2023',
        precio: 'Q720,000',
        estado: 'Disponible',
        kilometraje: '5,600 km',
        color: 'Blanco',
        image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
      },
      {
        id: 75,
        marca: 'Rivian',
        modelo: 'R1T',
        año: '2024',
        precio: 'Q850,000',
        estado: 'Vendido',
        kilometraje: '1,900 km',
        color: 'Verde',
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop'
      },
      {
        id: 76,
        marca: 'Rivian',
        modelo: 'R1S',
        año: '2023',
        precio: 'Q880,000',
        estado: 'Disponible',
        kilometraje: '3,300 km',
        color: 'Azul',
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
      },
      {
        id: 77,
        marca: 'Lucid',
        modelo: 'Air',
        año: '2024',
        precio: 'Q920,000',
        estado: 'Disponible',
        kilometraje: '1,200 km',
        color: 'Negro',
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop'
      },
      {
        id: 78,
        marca: 'Polestar',
        modelo: '2',
        año: '2023',
        precio: 'Q450,000',
        estado: 'Vendido',
        kilometraje: '6,700 km',
        color: 'Plata',
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop'
      },
      {
        id: 79,
        marca: 'Polestar',
        modelo: '3',
        año: '2024',
        precio: 'Q580,000',
        estado: 'Disponible',
        kilometraje: '2,800 km',
        color: 'Blanco',
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop'
      },
      {
        id: 80,
        marca: 'Audi',
        modelo: 'e-tron',
        año: '2023',
        precio: 'Q520,000',
        estado: 'En mantenimiento',
        kilometraje: '8,900 km',
        color: 'Gris',
        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop'
      },
      {
    id: 81,
    marca: 'Audi',
    modelo: 'e-tron GT',
    año: '2024',
    precio: 'Q780,000',
    estado: 'Disponible',
    kilometraje: '3,500 km',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
  },
  {
    id: 82,
    marca: 'BMW',
    modelo: 'i4',
    año: '2023',
    precio: 'Q480,000',
    estado: 'Vendido',
    kilometraje: '7,200 km',
    color: 'Azul',
    image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
  },
  {
    id: 83,
    marca: 'BMW',
    modelo: 'iX',
    año: '2024',
    precio: 'Q680,000',
    estado: 'Disponible',
    kilometraje: '4,100 km',
    color: 'Plata',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop'
  },
  {
    id: 84,
    marca: 'Mercedes-Benz',
    modelo: 'EQS',
    año: '2023',
    precio: 'Q820,000',
    estado: 'En mantenimiento',
    kilometraje: '5,800 km',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
  },
  {
    id: 85,
    marca: 'Mercedes-Benz',
    modelo: 'EQB',
    año: '2024',
    precio: 'Q520,000',
    estado: 'Disponible',
    kilometraje: '2,900 km',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
  },
  {
    id: 86,
    marca: 'Porsche',
    modelo: 'Taycan',
    año: '2023',
    precio: 'Q980,000',
    estado: 'Vendido',
    kilometraje: '4,200 km',
    color: 'Rojo',
    image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
  },
  {
    id: 87,
    marca: 'Ford',
    modelo: 'F-150 Lightning',
    año: '2024',
    precio: 'Q580,000',
    estado: 'Disponible',
    kilometraje: '6,700 km',
    color: 'Azul',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop'
  },
  {
    id: 88,
    marca: 'Chevrolet',
    modelo: 'Bolt EV',
    año: '2023',
    precio: 'Q280,000',
    estado: 'En mantenimiento',
    kilometraje: '12,400 km',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
  },
  {
    id: 89,
    marca: 'Nissan',
    modelo: 'Leaf',
    año: '2024',
    precio: 'Q260,000',
    estado: 'Disponible',
    kilometraje: '9,800 km',
    color: 'Verde',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop'
  },
  {
    id: 90,
    marca: 'Hyundai',
    modelo: 'Kona Electric',
    año: '2023',
    precio: 'Q320,000',
    estado: 'Vendido',
    kilometraje: '11,600 km',
    color: 'Gris',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop'
  },
  {
    id: 91,
    marca: 'Kia',
    modelo: 'EV6',
    año: '2024',
    precio: 'Q380,000',
    estado: 'Disponible',
    kilometraje: '5,300 km',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop'
  },
  {
    id: 92,
    marca: 'Volkswagen',
    modelo: 'ID.4',
    año: '2023',
    precio: 'Q340,000',
    estado: 'En mantenimiento',
    kilometraje: '8,900 km',
    color: 'Plata',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop'
  },
  {
    id: 93,
    marca: 'Volkswagen',
    modelo: 'ID.3',
    año: '2024',
    precio: 'Q300,000',
    estado: 'Disponible',
    kilometraje: '4,700 km',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
  },
  {
    id: 94,
    marca: 'Peugeot',
    modelo: 'e-208',
    año: '2023',
    precio: 'Q280,000',
    estado: 'Vendido',
    kilometraje: '10,200 km',
    color: 'Azul',
    image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
  },
  {
    id: 95,
    marca: 'Renault',
    modelo: 'Zoe',
    año: '2024',
    precio: 'Q250,000',
    estado: 'Disponible',
    kilometraje: '7,600 km',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop'
  },
  {
    id: 96,
    marca: 'Opel',
    modelo: 'Corsa-e',
    año: '2023',
    precio: 'Q270,000',
    estado: 'En mantenimiento',
    kilometraje: '13,800 km',
    color: 'Rojo',
    image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
  },
  {
    id: 97,
    marca: 'Fiat',
    modelo: '500e',
    año: '2024',
    precio: 'Q240,000',
    estado: 'Disponible',
    kilometraje: '6,400 km',
    color: 'Naranja',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop'
  },
  {
    id: 98,
    marca: 'Mini',
    modelo: 'Electric',
    año: '2023',
    precio: 'Q260,000',
    estado: 'Vendido',
    kilometraje: '9,100 km',
    color: 'Verde',
    image: 'https://images.unsplash.com/photo-1582639510494-c80b5de9f148?w=400&h=300&fit=crop'
  },
  {
    id: 99,
    marca: 'Smart',
    modelo: 'EQ fortwo',
    año: '2024',
    precio: 'Q180,000',
    estado: 'Disponible',
    kilometraje: '3,800 km',
    color: 'Gris',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop'
  },
  {
    id: 100,
    marca: 'Smart',
    modelo: 'EQ forfour',
    año: '2023',
    precio: 'Q200,000',
    estado: 'En mantenimiento',
    kilometraje: '7,200 km',
    color: 'Azul',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
  }
  ];  

// Función para conectar a MongoDB
async function connectToDatabase() {
  try {
    const configData = config();
    const mongoUri = configData.database.uri;
    const dbName = configData.database.name;
    
    if (!mongoUri) {
      throw new Error('MONGO_URI no está definida en las variables de entorno');
    }

    // Construir la URI completa con el nombre de la base de datos
    const fullUri = mongoUri.endsWith('/') 
      ? `${mongoUri}${dbName}` 
      : `${mongoUri}/${dbName}`;

    await mongoose.connect(fullUri);
  } catch (error) {
    console.error(' Error al conectar a MongoDB:', error);
    process.exit(1);
  }
}

// Función para insertar vehículos
async function insertVehicles() {
  try {
    
    // Limpiar la colección existente (opcional)
    await Vehicle.deleteMany({});
    
    // Insertar todos los vehículos
    const result = await Vehicle.insertMany(vehicles);
    
    
  } catch (error) {
    console.error(' Error al insertar vehículos:', error);
  }
}

// Función principal
async function main() {
  try {
    await connectToDatabase();
    await insertVehicles();
  } catch (error) {
    console.error(' Error en el proceso:', error);
  } finally {
    // Cerrar la conexión
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}

export { insertVehicles, connectToDatabase };
  

//comando para ejecutar el script npx ts-node proces/insertcars.ts