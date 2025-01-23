import { TestBed } from '@angular/core/testing';

import { TodoMgmtWebSocketService } from './todo-mgmt-web-socket.service';

describe('TodoMgmtWebSocketService', () => {
  let service: TodoMgmtWebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TodoMgmtWebSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
