import { Component, HostListener, Inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TodoManagementService } from '../todo-management.service';

interface Status {
  value: string;
}

interface Priority {
  value: string;
}

@Component({
  selector: 'app-add-edit-task',
  standalone: false,
  
  templateUrl: './add-edit-task.component.html',
  styleUrl: './add-edit-task.component.css'
})
export class AddEditTaskComponent implements OnDestroy{

  taskForm: FormGroup = new FormGroup({
    title : new FormControl('', Validators.required),
    description : new FormControl('', Validators.required),
    status : new FormControl('', Validators.required),
    priority : new FormControl('', Validators.required)
  });

  statusList: Status[] = [
    {value: 'Not Started'},
    {value: 'In-Progress'},
    {value: 'Completed'}
  ];

  priorityList: Priority[] = [
    {value: 'Low'},
    {value: 'Medium'},
    {value: 'High'}
  ];

  constructor(private fb: FormBuilder,
     @Inject(MAT_DIALOG_DATA) private data: any,
     public dialogRef: MatDialogRef<AddEditTaskComponent>,
      private todoService : TodoManagementService) { }


  ngOnInit() {
    if(this.data){
      this.taskForm.controls['title'].setValue(this.data['title']);
      this.taskForm.controls['description'].setValue(this.data['description']);
      this.taskForm.controls['status'].setValue(this.data['status']);
      this.taskForm.controls['priority'].setValue(this.data['priority']);
    }
  }

  protected readonly value = signal('');

  protected onInput(event: Event) {
    this.value.set((event.target as HTMLInputElement).value);
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      let value = this.taskForm.value;
      if(this.data){
        value['_id'] = this.data['_id'];
      }
      this.dialogRef.close(value); 
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: Event): void {
    if (this.data) {
      this.todoService.releaseLock(this.data['_id']).subscribe({
        next: data => { },
        error: error => { }
      });
    }
  }

  ngOnDestroy(): void {
    if(this.data){
      this.todoService.releaseLock(this.data['_id']).subscribe({
        next: data => {
        },
        error: error => {
        }
      });
    }
   
  }
}
