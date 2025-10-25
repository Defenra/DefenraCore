import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Domain from "@/models/Domain";
import { auth } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { domain, description } = body;

    if (!domain) {
      return NextResponse.json({ error: "Домен обязателен" }, { status: 400 });
    }

    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Некорректный формат домена" },
        { status: 400 },
      );
    }

    const existingDomain = await Domain.findOne({ domain });
    if (existingDomain) {
      return NextResponse.json(
        { error: "Домен уже существует" },
        { status: 409 },
      );
    }

    // Default GeoDNS configuration - popular countries
    const defaultGeoDnsConfig = [
      {
        "code": "AF",
        "name": "the Islamic Republic of Afghanistan[b]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AX",
        "name": "Åland[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AL",
        "name": "the Republic of Albania",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "DZ",
        "name": "the People's Democratic Republic of Algeria",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AS",
        "name": "American Samoa[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AD",
        "name": "the Principality of Andorra",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AO",
        "name": "the Republic of Angola",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AI",
        "name": "Anguilla[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AQ",
        "name": "Antarctica[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AG",
        "name": "Antigua and Barbuda[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AR",
        "name": "the Argentine Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AM",
        "name": "the Republic of Armenia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AW",
        "name": "the Country of Aruba[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AU",
        "name": "the Commonwealth of Australia[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AT",
        "name": "the Republic of Austria",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AZ",
        "name": "the Republic of Azerbaijan",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BS",
        "name": "the Commonwealth of The Bahamas",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BH",
        "name": "the Kingdom of Bahrain",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BD",
        "name": "the People's Republic of Bangladesh",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BB",
        "name": "Barbados[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BY",
        "name": "the Republic of Belarus",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BE",
        "name": "the Kingdom of Belgium",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BZ",
        "name": "Belize[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BJ",
        "name": "the Republic of Benin",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BM",
        "name": "Bermuda[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BT",
        "name": "the Kingdom of Bhutan",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BO",
        "name": "the Plurinational State of Bolivia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BQ",
        "name": "Bonaire, Sint Eustatius and Saba[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BA",
        "name": "Bosnia and Herzegovina[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BW",
        "name": "the Republic of Botswana",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BV",
        "name": "Bouvet Island[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BR",
        "name": "the Federative Republic of Brazil",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "IO",
        "name": "the British Indian Ocean Territory[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BN",
        "name": "Brunei Darussalam[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BG",
        "name": "the Republic of Bulgaria",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BF",
        "name": "Burkina Faso[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BI",
        "name": "the Republic of Burundi",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CV",
        "name": "the Republic of Cabo Verde",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "KH",
        "name": "the Kingdom of Cambodia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CM",
        "name": "the Republic of Cameroon",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CA",
        "name": "Canada[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "KY",
        "name": "the Cayman Islands[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CF",
        "name": "the Central African Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TD",
        "name": "the Republic of Chad",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CL",
        "name": "the Republic of Chile",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CN",
        "name": "the People's Republic of China",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CX",
        "name": "the Territory of Christmas Island[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CC",
        "name": "the Territory of Cocos (Keeling) Islands[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CO",
        "name": "the Republic of Colombia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "KM",
        "name": "the Union of the Comoros",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CD",
        "name": "the Democratic Republic of the Congo",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CG",
        "name": "the Republic of the Congo",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CK",
        "name": "the Cook Islands[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CR",
        "name": "the Republic of Costa Rica",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CI",
        "name": "the Republic of Côte d'Ivoire",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "HR",
        "name": "the Republic of Croatia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CU",
        "name": "the Republic of Cuba",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CW",
        "name": "the Country of Curaçao[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CY",
        "name": "the Republic of Cyprus",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CZ",
        "name": "the Czech Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "DK",
        "name": "the Kingdom of Denmark",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "DJ",
        "name": "the Republic of Djibouti",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "DM",
        "name": "the Commonwealth of Dominica",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "DO",
        "name": "the Dominican Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "EC",
        "name": "the Republic of Ecuador",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "EG",
        "name": "the Arab Republic of Egypt",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SV",
        "name": "the Republic of El Salvador",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GQ",
        "name": "the Republic of Equatorial Guinea",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "ER",
        "name": "the State of Eritrea",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "EE",
        "name": "the Republic of Estonia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SZ",
        "name": "the Kingdom of Eswatini",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "ET",
        "name": "the Federal Democratic Republic of Ethiopia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "FK",
        "name": "the Falkland Islands[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "FO",
        "name": "the Faroe Islands[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "FJ",
        "name": "the Republic of Fiji",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "FI",
        "name": "the Republic of Finland",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "FR",
        "name": "the French Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GF",
        "name": "Guyane[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PF",
        "name": "Overseas Lands of French Polynesia[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TF",
        "name": "the French Southern and Antarctic Lands[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GA",
        "name": "the Gabonese Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GM",
        "name": "the Republic of The Gambia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GE",
        "name": "Georgia[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "DE",
        "name": "the Federal Republic of Germany",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GH",
        "name": "the Republic of Ghana",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GI",
        "name": "Gibraltar[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GR",
        "name": "the Hellenic Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GL",
        "name": "Greenland[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GD",
        "name": "Grenada[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GP",
        "name": "Guadeloupe[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GU",
        "name": "Guam[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GT",
        "name": "the Republic of Guatemala",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GG",
        "name": "the Bailiwick of Guernsey[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GN",
        "name": "the Republic of Guinea",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GW",
        "name": "the Republic of Guinea-Bissau",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GY",
        "name": "the Co-operative Republic of Guyana",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "HT",
        "name": "the Republic of Haiti",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "HM",
        "name": "the Territory of Heard Island and McDonald Islands[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "VA",
        "name": "the Holy See[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "HN",
        "name": "the Republic of Honduras",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "HK",
        "name": "the Hong Kong Special Administrative Region of China[10]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "HU",
        "name": "Hungary[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "IS",
        "name": "Iceland[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "IN",
        "name": "the Republic of India",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "ID",
        "name": "the Republic of Indonesia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "IR",
        "name": "the Islamic Republic of Iran",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "IQ",
        "name": "the Republic of Iraq",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "IE",
        "name": "Ireland[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "IM",
        "name": "the Isle of Man[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "IL",
        "name": "the State of Israel",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "IT",
        "name": "the Italian Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "JM",
        "name": "Jamaica[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "JP",
        "name": "Japan[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "JE",
        "name": "the Bailiwick of Jersey[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "JO",
        "name": "the Hashemite Kingdom of Jordan",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "KZ",
        "name": "the Republic of Kazakhstan",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "KE",
        "name": "the Republic of Kenya",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "KI",
        "name": "the Republic of Kiribati",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "KP",
        "name": "the Democratic People's Republic of Korea",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "KR",
        "name": "the Republic of Korea",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "KW",
        "name": "the State of Kuwait",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "KG",
        "name": "the Kyrgyz Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "LA",
        "name": "the Lao People's Democratic Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "LV",
        "name": "the Republic of Latvia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "LB",
        "name": "the Lebanese Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "LS",
        "name": "the Kingdom of Lesotho",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "LR",
        "name": "the Republic of Liberia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "LY",
        "name": "the State of Libya",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "LI",
        "name": "the Principality of Liechtenstein",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "LT",
        "name": "the Republic of Lithuania",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "LU",
        "name": "the Grand Duchy of Luxembourg",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MO",
        "name": "the Macao Special Administrative Region of China[11]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MG",
        "name": "the Republic of Madagascar",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MW",
        "name": "the Republic of Malawi",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MY",
        "name": "Malaysia[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MV",
        "name": "the Republic of Maldives",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "ML",
        "name": "the Republic of Mali",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MT",
        "name": "the Republic of Malta",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MH",
        "name": "the Republic of the Marshall Islands",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MQ",
        "name": "Martinique[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MR",
        "name": "the Islamic Republic of Mauritania",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MU",
        "name": "the Republic of Mauritius",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "YT",
        "name": "the Department of Mayotte[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MX",
        "name": "the United Mexican States",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "FM",
        "name": "the Federated States of Micronesia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MD",
        "name": "the Republic of Moldova",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MC",
        "name": "the Principality of Monaco",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MN",
        "name": "Mongolia[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "ME",
        "name": "Montenegro[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MS",
        "name": "Montserrat[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MA",
        "name": "the Kingdom of Morocco",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MZ",
        "name": "the Republic of Mozambique",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MM",
        "name": "the Republic of the Union of Myanmar[d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "NA",
        "name": "the Republic of Namibia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "NR",
        "name": "the Republic of Nauru",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "NP",
        "name": "the Federal Democratic Republic of Nepal[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "NL",
        "name": "the Kingdom of the Netherlands",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "NC",
        "name": "New Caledonia[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "NZ",
        "name": "New Zealand[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "NI",
        "name": "the Republic of Nicaragua",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "NE",
        "name": "the Republic of the Niger",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "NG",
        "name": "the Federal Republic of Nigeria",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "NU",
        "name": "Niue[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "NF",
        "name": "the Territory of Norfolk Island[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MK",
        "name": "the Republic of North Macedonia[12]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MP",
        "name": "the Commonwealth of the Northern Mariana Islands",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "NO",
        "name": "the Kingdom of Norway",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "OM",
        "name": "the Sultanate of Oman",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PK",
        "name": "the Islamic Republic of Pakistan",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PW",
        "name": "the Republic of Palau",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PS",
        "name": "the State of Palestine[d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PA",
        "name": "the Republic of Panama",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PG",
        "name": "the Independent State of Papua New Guinea",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PY",
        "name": "the Republic of Paraguay",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PE",
        "name": "the Republic of Peru",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PH",
        "name": "the Republic of the Philippines",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PN",
        "name": "the Pitcairn, Henderson, Ducie and Oeno Islands[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PL",
        "name": "the Republic of Poland",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PT",
        "name": "the Portuguese Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PR",
        "name": "the Commonwealth of Puerto Rico[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "QA",
        "name": "the State of Qatar",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "RE",
        "name": "Réunion[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "RO",
        "name": "Romania[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "RU",
        "name": "the Russian Federation",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "RW",
        "name": "the Republic of Rwanda",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "BL",
        "name": "the Collectivity of Saint-Barthélemy[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SH",
        "name": "Saint Helena, Ascension and Tristan da Cunha[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "KN",
        "name": "the Federation of Saint Kitts and Nevis[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "LC",
        "name": "Saint Lucia[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "MF",
        "name": "the Collectivity of Saint-Martin[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "PM",
        "name": "the Overseas Collectivity of Saint-Pierre and Miquelon[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "VC",
        "name": "Saint Vincent and the Grenadines[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "WS",
        "name": "the Independent State of Samoa",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SM",
        "name": "the Republic of San Marino",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "ST",
        "name": "the Democratic Republic of São Tomé and Príncipe",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SA",
        "name": "the Kingdom of Saudi Arabia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SN",
        "name": "the Republic of Senegal",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "RS",
        "name": "the Republic of Serbia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SC",
        "name": "the Republic of Seychelles",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SL",
        "name": "the Republic of Sierra Leone",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SG",
        "name": "the Republic of Singapore",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SX",
        "name": "Sint Maarten[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SK",
        "name": "the Slovak Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SI",
        "name": "the Republic of Slovenia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SB",
        "name": "the Solomon Islands[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SO",
        "name": "the Federal Republic of Somalia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "ZA",
        "name": "the Republic of South Africa",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GS",
        "name": "South Georgia and the South Sandwich Islands",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SS",
        "name": "the Republic of South Sudan",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "ES",
        "name": "the Kingdom of Spain",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "LK",
        "name": "the Democratic Socialist Republic of Sri Lanka",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SD",
        "name": "the Republic of the Sudan",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SR",
        "name": "the Republic of Suriname",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SJ",
        "name": "Svalbard and Jan Mayen[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SE",
        "name": "the Kingdom of Sweden",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "CH",
        "name": "the Swiss Confederation",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "SY",
        "name": "the Syrian Arab Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TW",
        "name": "the Republic of China[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TJ",
        "name": "the Republic of Tajikistan",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TZ",
        "name": "the United Republic of Tanzania",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TH",
        "name": "the Kingdom of Thailand",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TL",
        "name": "the Democratic Republic of Timor-Leste",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TG",
        "name": "the Togolese Republic",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TK",
        "name": "Tokelau[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TO",
        "name": "the Kingdom of Tonga",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TT",
        "name": "the Republic of Trinidad and Tobago",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TN",
        "name": "the Republic of Tunisia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TR",
        "name": "the Republic of Türkiye",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TM",
        "name": "Turkmenistan[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TC",
        "name": "the Turks and Caicos Islands[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "TV",
        "name": "Tuvalu[c]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "UG",
        "name": "the Republic of Uganda",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "UA",
        "name": "Ukraine",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "AE",
        "name": "the United Arab Emirates",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "GB",
        "name": "the United Kingdom of Great Britain and Northern Ireland",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "UM",
        "name": "United States Pacific Island Wildlife Refuges,[14] Navassa Island, and Wake Island[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "US",
        "name": "the United States of America",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "UY",
        "name": "the Oriental Republic of Uruguay",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "UZ",
        "name": "the Republic of Uzbekistan",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "VU",
        "name": "the Republic of Vanuatu",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "VE",
        "name": "the Bolivarian Republic of Venezuela",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "VN",
        "name": "the Socialist Republic of Viet Nam",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "VG",
        "name": "the Virgin Islands[d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "VI",
        "name": "the Virgin Islands of the United States",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "WF",
        "name": "the Territory of the Wallis and Futuna Islands",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "EH",
        "name": "the Sahrawi Arab Democratic Republic[c][d]",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "YE",
        "name": "the Republic of Yemen",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "ZM",
        "name": "the Republic of Zambia",
        "type": "country",
        "agentIds": []
      },
      {
        "code": "ZW",
        "name": "the Republic of Zimbabwe",
        "type": "country",
        "agentIds": []
      }
    ]

    const newDomain = await Domain.create({
      domain,
      description,
      userId: session.user.id,
      geoDnsConfig: defaultGeoDnsConfig,
    });

    return NextResponse.json({
      message: "Домен успешно создан",
      domain: {
        id: newDomain._id,
        domain: newDomain.domain,
        isActive: newDomain.isActive,
        description: newDomain.description,
      },
    });
  } catch (error) {
    console.error("Domain creation error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании домена" },
      { status: 500 },
    );
  }
}
