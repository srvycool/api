import Url from "url";
import { HmacSHA256, SHA256 } from "crypto-js";

export const sign = (
  request,
  access_info,
  service_info: { region: string; service: string } | null = null
) => {
  request.headers = request.headers || {};

  // datetime string and date string
  var dt = new Date(),
    dt_str = dt.toISOString().replace(/[:-]|\.\d{3}/g, ""),
    d_str = dt_str.substr(0, 8),
    algorithm = "AWS4-HMAC-SHA256";

  var url_info = Url.parse(request.url);
  request.headers["host"] = url_info.host;
  request.headers["x-amz-date"] = dt_str;
  if (access_info.session_token) {
    request.headers["X-Amz-Security-Token"] = access_info.session_token;
  }

  // Task 1: Create a Canonical Request
  var request_str = canonical_request(request);

  // Task 2: Create a String to Sign
  service_info = service_info || parse_service_info(request);
  var scope = credential_scope(
    d_str,
    service_info.region,
    service_info.service
  );
  var str_to_sign = string_to_sign(algorithm, request_str, dt_str, scope);

  // Task 3: Calculate the Signature
  var signing_key = get_signing_key(
      access_info.secret_key,
      d_str,
      service_info
    ),
    signature = get_signature(signing_key, str_to_sign);

  // Task 4: Adding the Signing information to the Request
  var authorization_header = get_authorization_header(
    algorithm,
    access_info.access_key,
    scope,
    signed_headers(request.headers),
    signature
  );
  request.headers["Authorization"] = authorization_header;

  return request;
};

const encrypt = (key, src) => {
  return HmacSHA256(src, key);
};

const hash = (src) => {
  src = src || "";
  return SHA256(src);
};

const canonical_headers = (headers) => {
  if (!headers || Object.keys(headers).length === 0) {
    return "";
  }

  return (
    Object.keys(headers)
      .map(function (key) {
        return {
          key: key.toLowerCase(),
          value: headers[key] ? headers[key].trim().replace(/\s+/g, " ") : "",
        };
      })
      .sort(function (a, b) {
        return a.key < b.key ? -1 : 1;
      })
      .map(function (item) {
        return item.key + ":" + item.value;
      })
      .join("\n") + "\n"
  );
};

const signed_headers = (headers) => {
  return Object.keys(headers)
    .map(function (key) {
      return key.toLowerCase();
    })
    .sort()
    .join(";");
};

const canonical_request = (request) => {
  var url_info = Url.parse(request.url);

  return [
    request.method || "/",
    url_info.path,
    url_info.query,
    canonical_headers(request.headers),
    signed_headers(request.headers),
    hash(request.body),
  ].join("\n");
};

const parse_service_info = (request) => {
  var url_info = Url.parse(request.url),
    host = url_info.host;

  var matched = (host || "").match(/([^.]+)\.(?:([^.]*)\.)?amazonaws\.com$/),
    parsed = (matched || []).slice(1, 3);

  if (parsed[1] === "es") {
    // Elastic Search
    parsed = parsed.reverse();
  }

  return {
    service: request.service || parsed[0],
    region: request.region || parsed[1],
  };
};

const credential_scope = (d_str, region, service) => {
  return [d_str, region, service, "aws4_request"].join("/");
};

const string_to_sign = (algorithm, canonical_request, dt_str, scope) => {
  return [algorithm, dt_str, scope, hash(canonical_request)].join("\n");
};

const get_signing_key = (secret_key = "", d_str, service_info) => {
  var k = "AWS4" + secret_key,
    k_date = encrypt(k, d_str),
    k_region = encrypt(k_date, service_info.region),
    k_service = encrypt(k_region, service_info.service),
    k_signing = encrypt(k_service, "aws4_request");

  return k_signing;
};

const get_signature = (signing_key, str_to_sign) => {
  return encrypt(signing_key, str_to_sign);
};

const get_authorization_header = (
  algorithm,
  access_key = "",
  scope,
  signed_headers,
  signature
) => {
  return [
    algorithm + " " + "Credential=" + access_key + "/" + scope,
    "SignedHeaders=" + signed_headers,
    "Signature=" + signature,
  ].join(", ");
};
