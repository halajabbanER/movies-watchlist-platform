package com.movies.service;

import com.movies.entity.User;
import com.movies.entity.enums.Role;
import com.movies.repository.UserRepository;
import com.movies.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public Map<String, Object> registerUser(String username, String email, String password) {
        String cleanUsername = username != null ? username.trim() : "";
        String cleanEmail = email != null ? email.trim().toLowerCase() : "";

        if (cleanUsername.isEmpty() || cleanEmail.isEmpty() || password == null || password.length() < 6) {
            throw new IllegalArgumentException("Username, valid email, and password (min 6 chars) are required.");
        }
        if (userRepository.existsByUsername(cleanUsername)) {
            throw new IllegalArgumentException("This username is already taken. Please choose another username.");
        }
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException(
                    "This email address is already registered. Please use a different email.");
        }

        User user = User.builder()
                .username(cleanUsername)
                .email(cleanEmail)
                .password(passwordEncoder.encode(password))
                .role(Role.ROLE_USER)
                .build();

        User saved = userRepository.save(user);
        return buildAuthResponse(saved);
    }

    public Map<String, Object> loginUser(String emailOrUsername, String password) {
        String identifier = emailOrUsername != null ? emailOrUsername.trim() : "";
        User user = userRepository.findByEmail(identifier.toLowerCase())
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials. User not found."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials. Incorrect password.");
        }

        return buildAuthResponse(user);
    }

    private Map<String, Object> buildAuthResponse(User user) {
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("token", token);
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().name());
        return response;
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

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found");
        }
        userRepository.deleteById(id);
    }

    @Transactional
    public User updateUserRole(Long id, Role newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setRole(newRole);
        return userRepository.save(user);
    }
}