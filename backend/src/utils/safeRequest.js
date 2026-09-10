const dns = require("dns");
const dnsPromises = require("dns/promises");
const http = require("http");
const https = require("https");
const net = require("net");

const DEFAULT_ERROR = "ERR: Media tidak dapat diputar";

function isPrivateIPv4(address) {
  const parts = address.split(".").map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isPrivateAddress(address) {
  const type = net.isIP(address);

  if (type === 4) {
    return isPrivateIPv4(address);
  }

  if (type === 6) {
    const lower = address.toLowerCase();

    // Check IPv4-mapped IPv6 address (e.g. ::ffff:127.0.0.1)
    if (lower.startsWith("::ffff:")) {
      const mappedIpv4 = lower.slice(7);
      if (net.isIP(mappedIpv4) === 4) {
        return isPrivateIPv4(mappedIpv4);
      }
    }

    return (
      lower === "::1" ||
      lower === "::" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb") ||
      lower.startsWith("ff")
    );
  }

  return true;
}

function safeDnsLookup(hostname, options, callback) {
  dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err) {
      return callback(err);
    }

    if (!addresses || addresses.length === 0) {
      return callback(new Error("ERR: Gagal menyelesaikan alamat host"));
    }

    for (const record of addresses) {
      if (isPrivateAddress(record.address)) {
        return callback(new Error("ERR: Akses ke alamat IP lokal/privat dilarang"));
      }
    }

    if (typeof options === "object" && options.all) {
      return callback(null, addresses);
    }

    const first = addresses[0];
    return callback(null, first.address, first.family);
  });
}

const safeHttpAgent = new http.Agent({
  lookup: safeDnsLookup,
  keepAlive: false,
  timeout: 30000
});

const safeHttpsAgent = new https.Agent({
  lookup: safeDnsLookup,
  keepAlive: false,
  timeout: 30000
});

async function validateMediaUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) {
    throw new Error(DEFAULT_ERROR);
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error(DEFAULT_ERROR);
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(DEFAULT_ERROR);
  }

  const records = await dnsPromises.lookup(parsedUrl.hostname, { all: true });

  if (records.length === 0 || records.some((record) => isPrivateAddress(record.address))) {
    throw new Error(DEFAULT_ERROR);
  }

  return parsedUrl;
}

function getSafeAxiosAgents() {
  return {
    httpAgent: safeHttpAgent,
    httpsAgent: safeHttpsAgent
  };
}

module.exports = {
  isPrivateAddress,
  safeDnsLookup,
  safeHttpAgent,
  safeHttpsAgent,
  validateMediaUrl,
  getSafeAxiosAgents
};
