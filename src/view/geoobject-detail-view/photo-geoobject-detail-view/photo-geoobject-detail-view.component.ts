import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';

@Component({
  selector: 'geo-photo-geoobject-detail-view',
  templateUrl: './photo-geoobject-detail-view.component.html',
  styleUrls: ['./photo-geoobject-detail-view.component.scss']
})
export class PhotoGeoobjectDetailViewComponent implements OnInit{
  @ViewChild('container') container!: ElementRef;
  photos: string[] = [
    '../../../assets/img/1.jpg',
    '../../../assets/img/2.jpg',
    '../../../assets/img/3.jpg',
    '../../../assets/img/4.jpg',
    '../../../assets/img/yangantau.jpg'
  ];

  scrollToPrevious() {
    const containerElement = this.container.nativeElement;
    const scrollLeft = containerElement.scrollLeft;
    const scrollWidth = containerElement.scrollWidth;
    const clientWidth = containerElement.clientWidth;
    const newPosition = scrollLeft - clientWidth;
    const finalPosition = newPosition < 0 ? 0 : newPosition;
    containerElement.scrollTo({ left: finalPosition, behavior: 'smooth' });
  }

  scrollToNext() {
    const containerElement = this.container.nativeElement;
    const scrollLeft = containerElement.scrollLeft;
    const scrollWidth = containerElement.scrollWidth;
    const clientWidth = containerElement.clientWidth;
    const newPosition = scrollLeft + clientWidth;
    const finalPosition = newPosition > scrollWidth - clientWidth ? scrollWidth - clientWidth : newPosition;
    containerElement.scrollTo({ left: finalPosition, behavior: 'smooth' });
  }


  constructor() {
  }
  ngOnInit():void {}

}
