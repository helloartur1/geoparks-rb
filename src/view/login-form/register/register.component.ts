import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AdminService } from '@api';
@Component({
  selector: 'geo-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form = this.fb.group({
    userName: [''],
    password: [''],
    confirmPassword: ['']
  });

  constructor(private fb: FormBuilder, private adminService: AdminService ) {}

  registerSubmit() {
    const { userName, password, confirmPassword } = this.form.value;

    if (!userName || !password || !confirmPassword) {
      alert("Все поля обязательны для заполнения");
      return;
    }

    if (password !== confirmPassword) {
      alert("Пароли не совпадают");
      return;
    }

    this.adminService.createUserAdminPost(
      userName as string,
      password as string,
      'user'
    ).subscribe({
      next: () => {
        alert("Пользователь успешно зарегистрирован!");
        this.form.reset();
      },
      error: (err) => {
        console.error(err);
        alert("Ошибка при регистрации");
      }
    });
  }


}
