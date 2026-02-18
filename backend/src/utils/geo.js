function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

const OFFICE_LAT = 28.67560168220942;
const OFFICE_LON = 77.19334844580769;
const ALLOWED_RADIUS_KM = 0.5; // 500 meters

exports.isWithinOfficeRange = (lat, lon) => {
    const distance = getDistanceFromLatLonInKm(lat, lon, OFFICE_LAT, OFFICE_LON);
    return distance <= ALLOWED_RADIUS_KM;
};

exports.getDistance = (lat1, lon1, lat2, lon2) => {
    return getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
};
