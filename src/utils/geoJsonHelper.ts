import { type DistrictGeoJsonRecord } from '@/services/districtsApi';

export function convertToGeoJson(records: DistrictGeoJsonRecord[]): any {
  const features: any[] = records.map((record) => {
    let parsedGeometry: any = null;
    
    if (record.boundary) {
      try {
        parsedGeometry = typeof record.boundary === 'string' 
          ? JSON.parse(record.boundary) 
          : record.boundary;
      } catch (err) {
        console.error(`Failed to parse boundary geometry for district: ${record.district_name}`, err);
      }
    }

    return {
      type: 'Feature',
      properties: {
        id: record.ROWID,
        name: record.district_name,
        code: record.district_code,
        slug: record.district_slug,
        center: record.center_lat && record.center_lng 
          ? [record.center_lat, record.center_lng] 
          : null,
      },
      geometry: parsedGeometry,
    };
  }).filter((f) => f.geometry !== null);

  return {
    type: 'FeatureCollection',
    features,
  };
}
