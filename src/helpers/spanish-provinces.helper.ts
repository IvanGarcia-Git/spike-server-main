/**
 * PRES-018 B2a — Deriva la "zona" de un lead a partir del código postal español.
 *
 * En España los dos primeros dígitos del CP identifican la provincia (01–52).
 * Usamos el nombre de provincia como zona geográfica para el motor de asignación.
 */

const PROVINCE_BY_PREFIX: Record<string, string> = {
  "01": "Álava",
  "02": "Albacete",
  "03": "Alicante",
  "04": "Almería",
  "05": "Ávila",
  "06": "Badajoz",
  "07": "Illes Balears",
  "08": "Barcelona",
  "09": "Burgos",
  "10": "Cáceres",
  "11": "Cádiz",
  "12": "Castellón",
  "13": "Ciudad Real",
  "14": "Córdoba",
  "15": "A Coruña",
  "16": "Cuenca",
  "17": "Girona",
  "18": "Granada",
  "19": "Guadalajara",
  "20": "Gipuzkoa",
  "21": "Huelva",
  "22": "Huesca",
  "23": "Jaén",
  "24": "León",
  "25": "Lleida",
  "26": "La Rioja",
  "27": "Lugo",
  "28": "Madrid",
  "29": "Málaga",
  "30": "Murcia",
  "31": "Navarra",
  "32": "Ourense",
  "33": "Asturias",
  "34": "Palencia",
  "35": "Las Palmas",
  "36": "Pontevedra",
  "37": "Salamanca",
  "38": "Santa Cruz de Tenerife",
  "39": "Cantabria",
  "40": "Segovia",
  "41": "Sevilla",
  "42": "Soria",
  "43": "Tarragona",
  "44": "Teruel",
  "45": "Toledo",
  "46": "Valencia",
  "47": "Valladolid",
  "48": "Bizkaia",
  "49": "Zamora",
  "50": "Zaragoza",
  "51": "Ceuta",
  "52": "Melilla",
};

/**
 * Devuelve el nombre de la provincia (zona) para un código postal español,
 * o null si el CP es inválido o no se puede determinar.
 */
export function zonaFromPostalCode(zipCode?: string | null): string | null {
  if (!zipCode) return null;
  const digits = String(zipCode).replace(/\D/g, "");
  if (digits.length < 2) return null;
  const prefix = digits.slice(0, 2);
  return PROVINCE_BY_PREFIX[prefix] ?? null;
}
