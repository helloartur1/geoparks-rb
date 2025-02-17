import { Injectable } from '@angular/core';
// @ts-expect-error miss type declaration  
import Openrouteservice from 'openrouteservice-js';  
// @ts-expect-error miss type declaration  
import polyline from '@mapbox/polyline';  
import LineString from 'ol/geom/LineString';  
import { Observable, from, of } from 'rxjs';  
import { IRouteConfig } from '../interfaces/route-config.interface';  
import { catchError, map } from 'rxjs/operators';  
import { format } from 'ol/coordinate';

// Define a new interface for the route result  
interface IRouteResult {  
  coordinates: Array<[number, number]>;  
  distance: number; // distance in meters  
  duration: number; // duration in seconds  
  ascent?: number;  
  descent?: number;  
  elevations?: number[];  // Array of elevation values corresponding to the coordinates
  coord_points? : number[];
  formattedCoords?: Array<number[]>
}  

@Injectable({  
  providedIn: 'root'  
})  
export class OpenRouteService {  

  constructor() { }  

  public getRoute$({ coordinates, profile }: IRouteConfig): Observable<IRouteResult> {  
    let orsDirections = new Openrouteservice.Directions({ api_key: '5b3ce3597851110001cf6248f0d961a50bc04e17b315f4ccec8fe8de' });  

    return from(orsDirections.calculate({  
      coordinates: coordinates,  
      profile,  
      format: 'json',  
      radiuses: [10000],
    })).pipe(map((res: any) => {  
      const decodedCoordinates = polyline.decode(res.routes[0].geometry).map((item: [number, number]) => item.reverse());  
      const line: LineString = new LineString(decodedCoordinates);  
      console.log(line);
      line.transform('EPSG:4326', 'EPSG:3857');  
        // Extracting distance and duration from the response  
      const distance = res.routes[0].summary.distance; // distance in meters  
      const duration = res.routes[0].summary.duration; // duration in seconds  
      const ascent = res.routes[0].summary.ascent;  
      const descent = res.routes[0].summary.descent;  
      const elevation = res.routes[0].summary.elevation;
      return {  
        coordinates: decodedCoordinates,  
        distance,  
        duration,  
        ascent,  
        descent,  
      };  
    }));  
  } 

  public getElevation$({ coordinates, profile }: IRouteConfig): Observable<IRouteResult> {  
    let orsDirections = new Openrouteservice.Directions({ api_key: '5b3ce3597851110001cf6248d985182c8c784d239613b235b0150a2b' });  

    return from(orsDirections.calculate({  
      coordinates: coordinates,  
      profile : profile,  
      format: 'geojson',  
      elevation: true,
      extra_info:["steepness",'surface'],
      radiuses: [10000],
    })).pipe(map((res: any) => {  
      console.log(res)
      const duration = res.features[0].summary; // duration in seconds  
      const ascent = res.features[0].summary;  
      const descent = res.features[0].summary;  
      const elevation = res.features[0].summary;
      const distance = 0;
      const feature = res.features[0];  // Access the first feature  
      const geometry = feature.geometry; // Get geometry from the feature  
      const coords = geometry.coordinates;
      const formattedCoords = coords.map((coord: number[]) => [coord[1], coord[0], coord[2]]); // Assuming coord is [lon, lat, elevation] 
      
      return {  
        coordinates,  
        distance,  
        duration,  
        ascent,  
        descent,
        formattedCoords
      };  
    }));  
  } 
  // public Altitude$({ coordinates, profile }: IRouteConfig): Observable<IRouteResult> {
  //   const Elevation = new Openrouteservice.Elevation({
  //     api_key: '5b3ce3597851110001cf6248d985182c8c784d239613b235b0150a2b',
  //   });

  //   // Формат входных и выходных данных

  //   return from(Elevation.lineElevation({
  //     format_in: 'encodedpolyline5', 
  //     format_out: 'encodedpolyline5',
  //     geometry: coordinates,
  //   })).pipe(
  //     map((res: any) => {
  //       // Log the response structure to verify the expected data
  //       console.log("@@@@", res);
  //       const decodedCoordinates = polyline.decode(res.routes[0].geometry).map((item: [number, number]) => item.reverse());
    
  //       // Safely check if geometry and coordinates exist before calling .map
  //       if (res && res.geometry && res.geometry.coordinates) {
  //         const elevations = res.geometry.coordinates.map((coord: any) => coord[2]);
  //         console.log("Elevations: ", elevations);
  //       } else {
  //         console.error("Error: No geometry or coordinates found in response");
  //       }
    
  //       return res;
  //     }),
      
  //   )
    
  // }
}
