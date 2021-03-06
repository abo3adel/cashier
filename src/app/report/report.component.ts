import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Bill } from '../interfaces/bill';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import * as moment from 'moment';
import { Moment } from 'moment';
import 'moment/locale/ar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDistroyComponent } from '../components/confirm-distroy/confirm-distroy.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-report',
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
    private DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
    private ERROR_MESS = 'حدث خطأ غير متوقع ، برجاء إعادة المحاولة لاحقاً';
    private SUCCESS_DEL_MESS = 'تمت الإزالة بنجاح';

    public loader = false;
    public data: Bill[] | MatTableDataSource<Bill> = [];
    public oldData: Bill[];
    public toDate: Moment | Date;
    public fromDate: Moment | Date;
    public minDate: Moment;
    public maxDate: Moment;
    public currentDate: Moment;
    public displayedColumns: string[] = [
        'typeId',
        'brandId',
        'state',
        'quantity',
        'price',
        'value',
        'updated_at',
        'id'
    ];

    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    constructor(
        private api: ApiService,
        private dialog: MatDialog,
        private snakeBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.getData();
        // this.minDate = new Date();
    }

    getData() {
        this.loader = true;

        this.api.get('bill').subscribe(
            (r: Bill[]) => {
                if (!r.length) {
                    this.showSnakeBar('لم يتم تسجيل أى فواتير', true);
                    this.loader = false;
                    return;
                }

                r = r.map(x => {
                    x.date = this.formatDate(x.updated_at);
                    return x;
                });

                this.oldData = [...r];

                this.updateTable(r);
                this.loader = false;
            },
            err => {
                console.log(err);
                this.loader = false;
            }
        );
    }

    getStateName(st: string) {
        return st === 'hot' ? 'ساخن' : 'بارد';
    }

    customFilter(bill: Bill, str: string) {
        const type = bill.type.name.trim().toLowerCase();
        const brand = bill.brand.name.trim().toLowerCase();
        const date = bill.created_at.trim().toLowerCase();

        return (
            type.indexOf(str) > -1 ||
            brand.indexOf(str) > -1 ||
            date.indexOf(str) > -1
        );
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        // console.log(filterValue);
        this.data.filter = filterValue.trim().toLowerCase();

        if ((this.data as MatTableDataSource<Bill>).paginator) {
            (this.data as MatTableDataSource<Bill>).paginator.firstPage();
        }
    }

    formatDate(date: string): string {
        const d = moment(date, this.DATE_FORMAT);
        moment.locale('ar-eg');

        return d.format('dddd DD MMMM YYYY [،] hh:mm a');
    }

    filterByDate() {
        this.loader = true;

        const newData = this.oldData.filter(x =>
            moment(x.updated_at).isBetween(
                this.fromDate,
                this.toDate,
                null,
                '[]'
            )
        );

        this.updateTable(newData);
        this.loader = false;
    }

    removeDateFilter() {
        this.loader = true;

        this.updateTable(this.oldData);

        this.loader = false;
    }

    private updateTable(datasource: Bill[]) {
        if (datasource.length) {
            // set minimum date and date value to oldest bill date
            const oldestDate = moment(
                this.oldData[0].updated_at,
                this.DATE_FORMAT
            );
            this.minDate = oldestDate;
            this.fromDate = oldestDate;

            // set maximum date and toDate to last bill date
            const maximumDate = moment(
                this.oldData[this.oldData.length - 1].updated_at,
                this.DATE_FORMAT
            );
            this.maxDate = maximumDate;
            this.toDate = maximumDate;
        }

        this.data = new MatTableDataSource(datasource);

        (this.data as MatTableDataSource<Bill>).filterPredicate = (
            bill: Bill,
            str: string
        ) => this.customFilter(bill, str);

        this.data.paginator = this.paginator;
        this.data.sort = this.sort;
    }

    removeBill(b: Bill) {
        const deleteDialog = this.dialog.open(ConfirmDistroyComponent, {
            // width: '250px',
            disableClose: true
        });

        deleteDialog.afterClosed().subscribe(r => {
            if (r) {
                this.loader = true;

                this.api.delete(`bill/${b.id}`).subscribe(
                    (d: { delete: boolean }) => {
                        if (d && d.delete) {
                            this.oldData = this.oldData.filter(
                                x => x.id !== b.id
                            );

                            this.updateTable(this.oldData);
                            this.showSnakeBar(this.SUCCESS_DEL_MESS, false);
                        } else {
                            this.showSnakeBar(this.ERROR_MESS);
                        }
                        this.loader = false;
                    },
                    err => {
                        this.showSnakeBar(this.ERROR_MESS);
                        this.loader = false;
                    }
                );
            }
        });
    }

    private showSnakeBar(mess: string, isError: boolean = true) {
        this.snakeBar.open(mess, null, {
            duration: 2500,
            panelClass: [
                isError ? 'bg-danger' : 'bg-success',
                'text-center',
                'font-weight-bolder'
            ]
        });
    }
}
