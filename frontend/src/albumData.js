export const SPECIAL_GROUPS = [
  {
    id: 'special-top',
    name: 'Especiales FIFA World Cup',
    codes: ['FWC', '00', ...Array.from({ length: 8 }, (_, index) => `FWC${index + 1}`)]
  },
  {
    id: 'special-bottom',
    name: 'Especiales finales',
    codes: Array.from({ length: 11 }, (_, index) => `FWC${index + 9}`)
  },
  {
    id: 'collectors',
    name: 'Coca-Cola / Coleccionistas',
    codes: Array.from({ length: 14 }, (_, index) => `CC${index + 1}`)
  }
];

export const COUNTRY_GROUPS = [
  { prefix: 'MEX', name: 'México' },
  { prefix: 'RSA', name: 'Sudáfrica' },
  { prefix: 'KOR', name: 'Corea del Sur' },
  { prefix: 'CZE', name: 'República Checa' },
  { prefix: 'CAN', name: 'Canadá' },
  { prefix: 'BIH', name: 'Bosnia y Herzegovina' },
  { prefix: 'QAT', name: 'Qatar' },
  { prefix: 'SUI', name: 'Suiza' },
  { prefix: 'BRA', name: 'Brasil' },
  { prefix: 'MAR', name: 'Marruecos' },
  { prefix: 'HAI', name: 'Haití' },
  { prefix: 'SCO', name: 'Escocia' },
  { prefix: 'USA', name: 'Estados Unidos' },
  { prefix: 'PAR', name: 'Paraguay' },
  { prefix: 'AUS', name: 'Australia' },
  { prefix: 'TUR', name: 'Turquía' },
  { prefix: 'GER', name: 'Alemania' },
  { prefix: 'CUW', name: 'Curazao' },
  { prefix: 'CIV', name: 'Costa de Marfil' },
  { prefix: 'ECU', name: 'Ecuador' },
  { prefix: 'NED', name: 'Países Bajos' },
  { prefix: 'JPN', name: 'Japón' },
  { prefix: 'SWE', name: 'Suecia' },
  { prefix: 'TUN', name: 'Túnez' },
  { prefix: 'BEL', name: 'Bélgica' },
  { prefix: 'EGY', name: 'Egipto' },
  { prefix: 'IRN', name: 'Irán' },
  { prefix: 'NZL', name: 'Nueva Zelanda' },
  { prefix: 'ESP', name: 'España' },
  { prefix: 'CPV', name: 'Cabo Verde' },
  { prefix: 'KSA', name: 'Arabia Saudita' },
  { prefix: 'URU', name: 'Uruguay' },
  { prefix: 'FRA', name: 'Francia' },
  { prefix: 'SEN', name: 'Senegal' },
  { prefix: 'IRQ', name: 'Irak' },
  { prefix: 'NOR', name: 'Noruega' },
  { prefix: 'ARG', name: 'Argentina' },
  { prefix: 'ALG', name: 'Argelia' },
  { prefix: 'AUT', name: 'Austria' },
  { prefix: 'JOR', name: 'Jordania' },
  { prefix: 'POR', name: 'Portugal' },
  { prefix: 'COD', name: 'RD Congo' },
  { prefix: 'UZB', name: 'Uzbekistán' },
  { prefix: 'COL', name: 'Colombia' },
  { prefix: 'ENG', name: 'Inglaterra' },
  { prefix: 'CRO', name: 'Croacia' },
  { prefix: 'GHA', name: 'Ghana' },
  { prefix: 'PAN', name: 'Panamá' }
];

export const getCountryCodes = (prefix) =>
  Array.from({ length: 20 }, (_, index) => `${prefix}${index + 1}`);

export const getStampType = (code) => {
  const normalizedCode = String(code || '').toUpperCase().trim();

  if (
    normalizedCode === 'FWC' ||
    normalizedCode === '00' ||
    normalizedCode.startsWith('FWC') ||
    normalizedCode.startsWith('CC')
  ) {
    return 'special';
  }

  const country = COUNTRY_GROUPS.find((group) => normalizedCode.startsWith(group.prefix));
  if (country) {
    const number = Number(normalizedCode.replace(country.prefix, ''));
    if (number === 1) {
      return 'shield';
    }
    if (number === 13) {
      return 'group';
    }
  }

  return 'player';
};
