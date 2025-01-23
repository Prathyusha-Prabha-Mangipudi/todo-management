import { TestBed } from '@angular/core/testing';

import { TodoManagementService } from './todo-management.service';

describe('TodoManagementService', () => {
  let service: TodoManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TodoManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
