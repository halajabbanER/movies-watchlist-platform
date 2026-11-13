package com.movies.service;

import com.movies.entity.User;
import com.movies.entity.enums.Role;
import com.movies.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User registerUser(String username, String email, String password) {
        String cleanUsername = username != null ? username.trim() : "";
        String cleanEmail = email != null ? email.trim().toLowerCase() : "";

        if (userRepository.existsByUsername(cleanUsername)) {
            throw new IllegalArgumentException("اسم المستخدم مأخوذ بالفعل، يرجى اختيار اسم آخر");
        }
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر");
        }

        User user = User.builder()
                .username(cleanUsername)
                .email(cleanEmail)
                .password(password)
                .role(Role.ROLE_USER)
                .build();

        return userRepository.save(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}