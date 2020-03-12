import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Brand } from '../../interfaces/brand';
import { Type } from '../../interfaces/type';
import { ApiService } from '../../services/api.service';
import { NgForm } from '@angular/forms';

@Component({
    selector: 'app-addnew',
    templateUrl: './addnew.component.html',
    styleUrls: ['./addnew.component.scss']
})
export class AddnewComponent implements OnInit {
    public result: any;
    public isBrand = false;
    public types: Type[] = [];
    public isLoading = false;

    // form props
    public typeId: number;
    public name: string;
    public price;

    @ViewChild('addTypeOrBrand') form: NgForm;

    constructor(
        public dialogRef: MatDialogRef<AddnewComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private api: ApiService
    ) {
        this.isBrand = this.data.brand;
        this.types = this.data.types;
    }

    ngOnInit(): void {}

    save(f): void {
        if (this.isLoading || !f.name || !f.name.length) {
            return;
        }

        this.isLoading = true;
        const obj = {
            name: f.name,
            typeId: null,
            price: null,
        };

        if (this.isBrand) {
            obj.typeId = f.typeId;
            obj.price = f.price || 0;

            this.api.post(`type/${f.typeId}`, obj).subscribe(
                r => {
                    // console.log(r);
                    this.isLoading = false;
                    this.result = r;
                    this.typeId = null;
                    this.name = '';
                    this.price = null;
                    this.close();
                },
                err => {
                    console.log(err);
                    this.isLoading = false;
                }
            );
        } else {
            this.api.post('type', obj).subscribe(
                r => {
                    this.isLoading = false;
                    // console.log(r);
                    this.result = r;
                    this.name = '';
                    this.close();
                },
                err => {
                    console.log(err);
                    this.isLoading = false;
                }
            );
        }
    }

    close() {
        this.dialogRef.close(this.result);
    }
}
