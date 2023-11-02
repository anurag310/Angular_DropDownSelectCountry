import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as Highcharts from 'highcharts';
import HC_map from 'highcharts/modules/map';
import { countries, getCountryCode } from 'countries-list';
import { Country, State } from 'country-state-city';

HC_map(Highcharts);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  chart: any;
  countries: any[] = [];
  selectedCountry: string = '';
  selectedState: string = '';
  selectedCountryStates: string[] = [];
  currentMapSeries: any | null = null; // Store the current map series
  stateNames: string[] = [];
  getCountries(): any[] {
    return Object.values(countries);
  }

  ngOnInit(): void {
    this.countries = this.getCountries();
  }

  ngAfterViewInit(): void {
    this.chart = (Highcharts.mapChart as any)(this.chartContainer.nativeElement, {
      chart: {
        type: 'map',
        events: {
          drilldown: this.drilldown.bind(this),
          drillup: this.afterDrillUp.bind(this)
        }
      },
      title: {
        text: 'World Map'
      },
      colorAxis: {
        min: 0,
        minColor: '#E6E7E8',
        maxColor: '#005645'
      },
      mapNavigation: {
        enabled: true,
        buttonOptions: {
          verticalAlign: 'bottom'
        }
      },
      plotOptions: {
        map: {
          states: {
            hover: {
              color: '#EEDD66'
            }
          },
          point: {
            events: {
              click: this.pointClick.bind(this)
            }
          }
        }
      },
      series: [
        {
          data: [],
          name: 'World',
          dataLabels: {
            enabled: true,
            format: '{point.name}'
          }
        }
      ],
      drilldown: {
        activeDataLabelStyle: {
          color: '#FFFFFF',
          textDecoration: 'none',
          textOutline: '1px #000000'
        }
      }, credits: {
        enabled: false // Disable the highcharts.com link
      }
    });

    this.loadWorldMap();
  }

  loadWorldMap() {
    fetch('https://code.highcharts.com/mapdata/custom/world.geo.json')
      .then((response) => response.json())
      .then((worldData) => {
        this.chart.showLoading('Loading world map...');
        this.chart.hideLoading();
        this.addMapSeries('World', Highcharts.geojson(worldData));
      });
  }

  drilldown(e: any) {
    if (!e.seriesOptions) {
      const chart = this.chart;
      const countryCode = e.point.properties['iso-a2'].toLowerCase().substr(0, 2);
      chart.showLoading(`Loading map for ${e.point.name}...`);

      fetch(`https://code.highcharts.com/mapdata/countries/${countryCode}/${countryCode}-all.geo.json`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch map data for ${e.point.name}. Status: ${response.status}`);
          }
          return response.json();
        })
        .then((countryData) => {
          chart.hideLoading();
          this.removeMapSeries();
          this.addMapSeries(countryCode, Highcharts.geojson(countryData));
        })
        .catch((error) => {
          chart.hideLoading();
          console.error(error);
        });
    }
  }

  afterDrillUp(e: any) {
    if (e.seriesOptions) {
      this.removeMapSeries();
      this.loadWorldMap();
    }
  }

  pointClick(e: any) {
    this.drilldown({
      target: e.target,
      point: e.point
    });
  }

  onCountryChange() {
    debugger
    this.stateNames = [];
    const name = this.selectedCountry;
    const countryCode = getCountryCode(name);
    
    if (countryCode) {
      
      const states = State.getStatesOfCountry(countryCode);
      this.stateNames = states.map(state => state.name);
      console.log("State",this.stateNames);
      this.selectCountry(countryCode.toLowerCase());
    } else {
      console.error(`No ISO2 code found for ${this.selectedCountry}`);
    }
  }

  // onStateChange() {
  //   if (this.selectedState) {
  //     this.selectState(this.selectedState);
  //   }
  // }
  onStateChange() {
    debugger;
  
    if (this.selectedState) {
      const stateName = this.selectedState;
  
      // Get the country code
      const countryCode = getCountryCode(this.selectedCountry);
  
      if (countryCode) {
        const countryISOCodeMapping = this.getStatesISOCodesByCountryCode(countryCode);
        const stateCode = countryISOCodeMapping[stateName];
  
        if (stateCode) {
          // Use the stateCode and countryCode as needed
          this.selectState(stateCode.toLowerCase(), countryCode.toLowerCase());
        } else {
          console.error(`No ISO Code found for ${stateName}`);
        }
      } else {
        console.error(`No ISO2 code found for ${this.selectedCountry}`);
      }
    }
  }
  
  getStatesISOCodesByCountryCode(countryCode: string): { [key: string]: string } {
    debugger
    const states = State.getStatesOfCountry(countryCode);
    const isoCodeMapping: { [key: string]: string } = {};
  
    for (const state of states) {
      isoCodeMapping[state.name] = state.isoCode;
    }
    
    return isoCodeMapping;
  }

  selectCountry(countryCode: string) {
    const chart = this.chart;
    chart.showLoading(`Loading map for ${countryCode}...`);

    fetch(`https://code.highcharts.com/mapdata/countries/${countryCode}/${countryCode}-all.geo.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch map data for ${countryCode}. Status: ${response.status}`);
        }
        return response.json();
      })
      .then((countryData) => {
        chart.hideLoading();
        this.removeMapSeries();
        this.addMapSeries(countryCode, Highcharts.geojson(countryData));
      })
      .catch((error) => {
        chart.hideLoading();
        console.error(error);
      });

    this.selectedState = ''; // Clear the selected state when a new country is selected
  }
  

  selectState(stateCode: string, countryCode: string) {
    debugger
    const chart = this.chart;
    chart.showLoading(`Loading map for ${stateCode}...`);

    // Construct the URL based on the naming convention
    const url = `https://code.highcharts.com/mapdata/countries/${countryCode}/${countryCode}-${stateCode}-all.topo.json`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch map data for ${stateCode}, ${countryCode}. Status: ${response.status}`);
        }
        return response.json();
      })
      .then((stateData) => {
        chart.hideLoading();
        this.removeMapSeries();
        this.addMapSeries(stateCode, Highcharts.geojson(stateData));
      })
      .catch((error) => {
        chart.hideLoading();
        console.error(error);
      });

    this.selectedState = ''; // Clear the selected state when a new state is selected
  }


  // Function to add a map series
  addMapSeries(name: string, data: any) {
    this.currentMapSeries = this.chart.addSeries({
      type: 'map',
      name,
      data,
    });
  }

  // Function to remove the current map series
  removeMapSeries() {
    if (this.currentMapSeries) {
      this.currentMapSeries.remove();
    }
  }
}
