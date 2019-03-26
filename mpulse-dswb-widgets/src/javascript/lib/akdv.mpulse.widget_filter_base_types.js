;((window) => {

  'use strict';
  window.WidgetFilterBaseFilterTypes = 
  {
    // Must be kept in sync with the Java side (com.soasta.web.concerto.dashboard.enums.WidgetFilterAttributeType)
    //removeIf(sync_mpulse_filter_types)
    DateTime:"Date/Time",
    Series:"Series",
    DurationTimespan:"Duration Timespan",
    Collection:"Collection",
    CollectionName:"Collection Name",
    Container:"Container",
    ParentContainer:"Parent Container",
    ElementStatus:"Element Status",
    ElementType:"Element Type",
    Operation:"Operation",
    Target:"Target",
    Location:"Location",
    Domain:"Domain",
    DomainStatus:"Domain Status",
    Clip:"Clip",
    Track:"Track",
    Distribution:"Distribution",
    PropertyName:"Property Name",
    PropertyValue:"Property Value",
    TimeFormat:"Time Format",
    Edition:"Edition",
    TenantName:"Tenant",
    LicenseName:"License Name",
    RegisteredDeviceAgents:"Registered Device Agents",
    MaxExternalMaestros:"Max External Maestros",
    MaxConcurrentVUs:"Max Concurrent VUs",
    MaxConductors:"Max Conductors",
    MaxGridsAndResultsDatabases:"Max Grids And Results Databases",
    MaxTenants:"Max Tenants",
    MaxDeviceAgents:"Max Device Agents",
    MinVUPercent: "Min VU Percent",
    NetworkEmulationProfile: "Network Emulation Profile",
    DeviceAgentDeregistersAllowed:"Device Agent Deregisters Allowed",
    CloudServersRunning:"Cloud Servers Running",
    Build:"Build",
    LicenseStatus:"License Status",
    LicenseSource:"License Source",
    LicenseCountry:"License Country",
    LicenseState:"License State",
    Email:"Email",
    CompanyName:"Company Name",
    LicenseLastName:"Last Name",
    LicenseFirstName:"First Name",
    VirtualUsers: "Virtual Users",
    Alert:"Alert",
    AlertSeverity:"Alert Severity",
    RumRevenueMetric: "Revenue Metric",
    RumConversionMetric: "Conversion Metric",
    RumDomain: "mPulse Domain",
    RumPageGroup: "Page Group",
    RumUserAgent: "User Agent",
    RumUserAgentFamily: "User Agent Family",
    RumCountry: "Country",
    RumRegion: "Region",
    RumAbTest: "A/B Test",
    RumBeaconType: "Beacon Type",
    RumBwBlock: "Bandwidth Block",
    RumTimer: "Timer",
    RumMetric: "Metric",
    RumPercentile: "Percentile",
    RumCompareTo: "Compare To",
    RumOperatingSystem: "Operating System",
    RumOperatingSystemFamily: "Operating System Family",
    RumISP: "Internet Service Provider",
    RumUrl: "Url",
    RumUrlFull: "Full Url",
    RumConnectionType: "Connection Type",
    RumDevice: "Device",
    RumSiteVersion: "Site Version",
    RumNetworkError: "Network Error",
    RumGroupBy: "Group By",
    RumBeaconData: "Beacon",
    RumAppErrorData: "App Error",
    RumAppErrorCode: "App Error Code",
    RumAppErrorMessage: "App Error Message",
    RumAppErrorType: "App Error Type",
    RumAppErrorVia: "App Error Source",
    RumBoomerangVersion: "Boomerang Version",
    RumCustomDimension: "Custom Dimension",
    RumDeviceType: "Device Type",
    RumDeviceManufacturer: "Device Manufacturer",
    RumFactType: "Fact Type",
    RumAkamaiFEO: "Akamai Front-End Optimization",
    RumAkamaiAA: "Akamai Adaptive Acceleration",
    RumHttpProtocol: "HTTP Protocol",
    RumIPVersion: "IP Version",
    RumTLSVersion: "TLS Version",
    RumBeaconParam: "Beacon Param"
    //endRemoveIf(sync_mpulse_filter_types)
  };
})(window);