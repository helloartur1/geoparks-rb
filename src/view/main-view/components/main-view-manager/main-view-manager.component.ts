import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { CoordinatesType, IPointGeoObject } from '@core';
import { Subject } from 'rxjs';

export interface ICategoryItem {
  name: string;
  items: IPointGeoObject[];
}
const CATEGORY_NAMES: string[] = ['Культура, история и образование', 'Рекрация, отдых и развлечения', 'Природа и геология', 'Общая инфраструктура', 'Интересное место']
const DEFAULT_CATEGORY_LIST: ICategoryItem[] = [
  {
    name: 'Культура, история и образование',
    items: [],
  },
  {
    name: 'Рекрация, отдых и развлечения',
    items: [],
  },
  {
    name: 'Природа и геология',
    items: [],
  },
  {
    name: 'Общая инфраструктура',
    items: [],
  },
  {
    name: 'Интересное место',
    items: []
  }
];
const DETAIL_PAGE_ROUTE: string = 'detail';
@Component({
  selector: 'geo-main-view-manager',
  templateUrl: './main-view-manager.component.html',
  styleUrls: ['./main-view-manager.component.scss']
})
export class MainViewManagerComponent {
  @Input()
  public items: IPointGeoObject[] = [];

  @Input()
  public search: string = '';

  @Input()
  public isAdmin: boolean = false;

  @Output()
  public editObject: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public setView: EventEmitter<CoordinatesType> = new EventEmitter<CoordinatesType>();

  public categoryItems: ICategoryItem[] = [...DEFAULT_CATEGORY_LIST];

  constructor(private router: Router) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']?.currentValue) {
      this.initListByCategories(changes['items'].currentValue);
    }
  }

  public ngOnInit(): void {
    this.initListByCategories(this.items);
  }

  public zoomToObject(latitude: number, longitude: number): void {
    this.setView.emit({ latitude, longitude });
  }

  public navigateToDetailPage(uid: string): void {
    this.router.navigate([`${DETAIL_PAGE_ROUTE}/${uid}`]);
  }

  public trackByCategory(index: number, categoryItem: ICategoryItem): string {
    return categoryItem.name;
  }

  public trackByItem(index: number, item: IPointGeoObject): string {
    return item.id;
  }

  public onEditObject(id: string): void {
    this.editObject.emit(id);
  }

  public initListByCategories(items: IPointGeoObject[]): void {
    this.categoryItems = CATEGORY_NAMES.map((category: string) => {
      return {
        name: category,
        items: [],
      }
    });
    items.forEach((item: IPointGeoObject) => {
      let categoryIndex: number = this.categoryItems.findIndex((categoryItem: ICategoryItem) => categoryItem.name === item.common_type);
      if (categoryIndex >= 0) {
        this.categoryItems[categoryIndex].items = [...this.categoryItems[categoryIndex].items, item]
      }
    });
  }
}
